"""Server RVC untuk SuaraKu.
- Tetap bisa menyala walau paket RVC belum terpasang (cek di /health).
- Model "demo" memakai ffmpeg (tanpa AI) untuk menguji koneksi web ke server.
- Model RVC dibaca dari folder_info.json + Models/<grup>/model_info.json (atau models.json lama),
  dan hanya dilayani bila ada "owner" (pemilik/pemberi izin) dan "consent_verified": true."""
import asyncio, hashlib, importlib.util, json, logging, math, os, re, secrets, shutil, sqlite3, subprocess, tempfile, threading
from datetime import datetime, timedelta, timezone
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("SUARAKU_DB", os.path.join(BASE, "suaraku.db"))
MAX_BYTES = 10 * 1024 * 1024
DEMO = {"id": "demo", "name": "Demo server (tanpa AI, tes koneksi)", "owner": "SuaraKu", "license": "Bawaan"}
logger = logging.getLogger(__name__)

app = FastAPI(title="SuaraKu RVC")
app.add_middleware(CORSMiddleware, allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
                   allow_methods=["*"], allow_headers=["*"])

_converter = None
_converter_device = None
_converter_lock = threading.Lock()
LIVE_SAMPLE_RATE = 16000
LIVE_CHUNK_SECONDS = 6
LIVE_CHUNK_BYTES = LIVE_SAMPLE_RATE * LIVE_CHUNK_SECONDS * 2
LIVE_QUEUE_SIZE = 2


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            premium_until TEXT,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL,
            provider TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("ascii"), 120000).hex()
    return f"{salt}${digest}"


def verify_password(password, stored):
    try:
        salt, expected = stored.split("$", 1)
        return secrets.compare_digest(hash_password(password, salt).split("$", 1)[1], expected)
    except (AttributeError, ValueError):
        return False


def bearer_token(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        return ""
    return authorization[7:].strip()


def current_user(authorization=None):
    token = bearer_token(authorization)
    if not token:
        raise HTTPException(401, "Silakan masuk untuk melanjutkan.")
    with db() as conn:
        row = conn.execute(
            """SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?""",
            (token,),
        ).fetchone()
    if not row:
        raise HTTPException(401, "Sesi tidak valid atau sudah berakhir.")
    return dict(row)


def require_premium(authorization=None):
    user = current_user(authorization)
    premium_until = user.get("premium_until")
    if not premium_until:
        raise HTTPException(403, "Model RVC hanya tersedia untuk pengguna Premium.")
    try:
        active = datetime.fromisoformat(premium_until).replace(tzinfo=None) > datetime.now(timezone.utc).replace(tzinfo=None)
    except ValueError:
        active = False
    if not active:
        raise HTTPException(403, "Langganan Premium sudah berakhir.")
    return user


init_db()


def has_ffmpeg():
    return shutil.which("ffmpeg") is not None


def has_rvc():
    return importlib.util.find_spec("infer_rvc_python") is not None


def gpu_status():
    if not has_rvc():
        return {"available": False, "name": ""}
    import torch
    available = torch.cuda.is_available()
    return {
        "available": available,
        "name": torch.cuda.get_device_name(0) if available else "",
    }


def get_converter(device="auto"):
    global _converter, _converter_device
    gpu = gpu_status()
    if device == "gpu" and not gpu["available"]:
        raise HTTPException(503, "GPU CUDA tidak tersedia pada server ini.")
    selected_device = "gpu" if device == "gpu" or device == "auto" and gpu["available"] else "cpu"
    if _converter is None or _converter_device != selected_device:
        if _converter is not None:
            _converter.unload_models()
        from infer_rvc_python import BaseLoader  # impor lambat, hanya saat dibutuhkan
        _converter = BaseLoader(only_cpu=selected_device == "cpu", hubert_path=None, rmvpe_path=None)
        _converter_device = selected_device
    return _converter


def apply_audio_gain(input_path, gain_db):
    output = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    output.close()
    factor = math.pow(10, gain_db / 20)
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", input_path, "-vn", "-af", f"volume={factor:.8f}", output.name],
            check=True, capture_output=True,
        )
    except subprocess.CalledProcessError as exc:
        try:
            os.unlink(output.name)
        except OSError:
            pass
        raise HTTPException(500, "ffmpeg gagal menerapkan pengaturan gain audio.") from exc
    except OSError as exc:
        try:
            os.unlink(output.name)
        except OSError:
            pass
        raise HTTPException(503, "ffmpeg tidak tersedia untuk menerapkan pengaturan gain.") from exc
    return output.name


def remove_files(paths):
    for path in paths:
        try:
            os.unlink(path)
        except OSError:
            logger.warning("Could not remove temporary audio file %s", path)


def _read_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def scan_models():
    """Kumpulkan SEMUA kandidat model beserta daftar masalahnya (dipakai juga oleh check.py).
    Sumber 1: folder_info.json -> Models/<folder>/model_info.json
    Sumber 2 (lama): models.json berupa list."""
    found = []
    folders = _read_json(os.path.join(BASE, "folder_info.json"), {})
    for group, g in (folders.items() if isinstance(folders, dict) else []):
        if not g.get("enable", True):
            continue
        gdir = os.path.join("Models", g.get("folder_path", group))
        info = _read_json(os.path.join(BASE, gdir, "model_info.json"), {})
        for key, m in (info.items() if isinstance(info, dict) else []):
            if not m.get("enable", True):
                continue
            mdir = os.path.join(gdir, key)
            idx = m.get("feature_retrieval_library")
            found.append({
                "id": f"{group}/{key}", "name": m.get("title", key),
                "owner": m.get("owner", ""), "author": m.get("author", ""),
                "license": m.get("license", ""), "consent_verified": m.get("consent_verified"),
                "model": os.path.join(mdir, m.get("model_path", "")),
                "index": os.path.join(mdir, idx) if idx else "",
            })
    legacy = _read_json(os.path.join(BASE, "models.json"), [])
    found += [m for m in legacy if isinstance(m, dict) and m.get("id")] if isinstance(legacy, list) else []

    for m in found:
        p = []
        if m.get("consent_verified") is not True: p.append("consent_verified bukan true")
        if not str(m.get("owner", "")).strip(): p.append("owner (pemilik suara) kosong")
        if not m.get("model") or not os.path.isfile(os.path.join(BASE, m["model"])):
            p.append("file model tidak ditemukan: " + str(m.get("model")))
        if m.get("index") and not os.path.isfile(os.path.join(BASE, m["index"])):
            m["index"] = ""  # index opsional; abaikan bila hilang
        m["problems"] = p
    return found


def load_models():
    """Hanya model dengan pemilik/pemberi izin, izin terverifikasi, dan file .pth yang dilayani."""
    return {m["id"]: m for m in scan_models() if not m["problems"]}


@app.get("/health")
def health():
    gpu = gpu_status()
    return {
        "status": "ok", "ffmpeg": has_ffmpeg(), "rvc_installed": has_rvc(),
        "models": len(load_models()), "gpu_available": gpu["available"], "gpu_name": gpu["name"],
    }


@app.get("/models")
def models():
    out = [DEMO] if has_ffmpeg() else []
    out += [{"id": m["id"], "name": m["name"], "owner": m["owner"], "license": m.get("license", "")} for m in load_models().values()]
    return out


@app.post("/auth/register")
def register(name: str = Form(...), email: str = Form(...), password: str = Form(...)):
    name = name.strip()
    email = email.strip().lower()
    if len(name) < 2:
        raise HTTPException(400, "Nama minimal 2 karakter.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(400, "Format email tidak valid.")
    if len(password) < 8:
        raise HTTPException(400, "Password minimal 8 karakter.")
    token = secrets.token_urlsafe(32)
    try:
        with db() as conn:
            cursor = conn.execute(
                "INSERT INTO users(name,email,password_hash,created_at) VALUES(?,?,?,?)",
                (name, email, hash_password(password), datetime.now(timezone.utc).isoformat()),
            )
            user_id = cursor.lastrowid
            conn.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",
                         (token, user_id, datetime.now(timezone.utc).isoformat()))
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Email sudah terdaftar.")
    return {"token": token, "user": account_payload({"id": user_id, "name": name, "email": email, "premium_until": None})}


def account_payload(user):
    premium_until = user.get("premium_until")
    premium = False
    if premium_until:
        try:
            premium = datetime.fromisoformat(premium_until).replace(tzinfo=None) > datetime.now(timezone.utc).replace(tzinfo=None)
        except ValueError:
            premium = False
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "premium": premium,
        "premium_until": premium_until if premium else None,
    }


@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    email = email.strip().lower()
    with db() as conn:
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "Email atau password salah.")
    user = dict(user)
    token = secrets.token_urlsafe(32)
    with db() as conn:
        conn.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",
                     (token, user["id"], datetime.now(timezone.utc).isoformat()))
    return {"token": token, "user": account_payload(user)}


@app.get("/auth/account")
def account(authorization: str = Header(default="")):
    return account_payload(current_user(authorization))


@app.post("/auth/logout")
def logout(authorization: str = Header(default="")):
    token = bearer_token(authorization)
    with db() as conn:
        conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    return {"status": "logged_out"}


@app.post("/payments/demo")
def purchase_premium(months: int = Form(...), authorization: str = Header(default="")):
    if months not in {1, 12}:
        raise HTTPException(400, "Pilih paket 1 bulan atau 1 tahun.")
    user = current_user(authorization)
    amount = 49000 if months == 1 else 499000
    now = datetime.now(timezone.utc)
    current_end = None
    if user.get("premium_until"):
        try:
            parsed = datetime.fromisoformat(user["premium_until"])
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            if parsed > now:
                current_end = parsed
        except ValueError:
            pass
    premium_until = (current_end or now) + timedelta(days=30 if months == 1 else 365)
    with db() as conn:
        conn.execute("UPDATE users SET premium_until=? WHERE id=?", (premium_until.isoformat(), user["id"]))
        conn.execute(
            "INSERT INTO payments(user_id,plan,amount,status,provider,created_at) VALUES(?,?,?,?,?,?)",
            (user["id"], f"{months}_month" if months == 1 else "12_month",
             amount, "paid_demo", "demo", now.isoformat()),
        )
        updated = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return {"status": "active", "user": account_payload(dict(updated))}


@app.post("/convert")
async def convert(
    authorization: str = Header(default=""),
    model_id: str = Form(...),
    pitch: int = Form(0, ge=-12, le=12),
    input_gain_db: float = Form(0, ge=-24, le=12),
    output_gain_db: float = Form(0, ge=-24, le=12),
    chunk_seconds: int = Form(30, ge=10, le=40),
    index_influence: float = Form(0.66, ge=0, le=1),
    rms_mix_rate: float = Form(0.25, ge=0, le=1),
    consonant_protection: float = Form(0.33, ge=0, le=0.5),
    device: str = Form("auto"),
    audio: UploadFile = File(...),
):
    require_premium(authorization)
    if device not in {"auto", "cpu", "gpu"}:
        raise HTTPException(400, "Pilihan perangkat harus auto, cpu, atau gpu.")
    raw = await audio.read()
    if not raw:
        raise HTTPException(400, "File audio kosong.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "File terlalu besar (maks. 10 MB).")
    suffix = os.path.splitext(audio.filename or "")[1] or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(raw); tmp.close()
    input_path = tmp.name
    try:
        if model_id == "demo":
            if not has_ffmpeg():
                raise HTTPException(503, "ffmpeg belum terpasang.")
            out = tmp.name + "_demo.wav"
            subprocess.run(["ffmpeg", "-y", "-i", tmp.name, "-ar", "44100", "-af",
                            "asetrate=55125,aresample=44100,atempo=0.8", out], check=True, capture_output=True)
            if not os.path.isfile(out) or os.path.getsize(out) == 0:
                raise HTTPException(500, "Konversi demo tidak menghasilkan file audio.")
            return FileResponse(
                out, media_type="audio/wav", headers={"X-AI-Generated": "false"},
                background=BackgroundTask(remove_files, [out]),
            )
        m = load_models().get(model_id)
        if not m:
            raise HTTPException(400, "Model tidak tersedia atau belum terverifikasi izinnya.")
        if not has_rvc():
            raise HTTPException(503, "Paket infer_rvc_python belum terpasang.")
        try:
            with _converter_lock:
                conv = get_converter(device)
                if input_gain_db:
                    input_path = apply_audio_gain(tmp.name, input_gain_db)
                conv.config.x_center = chunk_seconds
                conv.config.x_max = chunk_seconds + 3
                conv.apply_conf(
                    tag=m["id"], file_model=os.path.join(BASE, m["model"]), pitch_algo="rmvpe+",
                    pitch_lvl=max(-12, min(12, pitch)), file_index=os.path.join(BASE, m["index"]) if m.get("index") else "",
                    index_influence=index_influence, respiration_median_filtering=3, envelope_ratio=rms_mix_rate,
                    consonant_breath_protection=consonant_protection)
                res = conv(input_path, m["id"], overwrite=False, parallel_workers=1)
        except Exception as exc:
            if isinstance(exc, HTTPException):
                raise
            logger.exception("RVC conversion failed for model %s", model_id)
            raise HTTPException(
                503,
                "Mesin RVC gagal dimuat atau memproses audio. Periksa terminal server; "
                "jika ada error NumPy/pyworld, jalankan Server\\setup.bat lalu mulai ulang server.",
            ) from exc
        if not res or not res[0] or not os.path.isfile(res[0]) or os.path.getsize(res[0]) == 0:
            raise HTTPException(500, "Konversi RVC tidak menghasilkan file audio.")
        try:
            output_path = apply_audio_gain(res[0], output_gain_db) if output_gain_db else res[0]
        except HTTPException:
            remove_files([res[0]])
            raise
        cleanup = [res[0]] if output_path != res[0] else []
        cleanup.append(output_path)
        return FileResponse(
            output_path, media_type="audio/wav", headers={"X-AI-Generated": "true"},
            background=BackgroundTask(remove_files, cleanup),
        )
    except subprocess.CalledProcessError:
        raise HTTPException(500, "ffmpeg gagal memproses file.")
    finally:
        remove_files([tmp.name] + ([input_path] if input_path != tmp.name else []))


def convert_live_chunk(raw_audio, model, settings):
    """Convert one little-endian mono PCM chunk and return PCM plus its sample rate."""
    samples = np.frombuffer(raw_audio, dtype="<i2").astype(np.float32) / 32768
    if samples.size < LIVE_SAMPLE_RATE:
        raise ValueError("Potongan audio Live minimal berdurasi 1 detik.")
    if settings["input_gain_db"]:
        samples *= math.pow(10, settings["input_gain_db"] / 20)
        samples = np.clip(samples, -1, 1)

    with _converter_lock:
        conv = get_converter(settings["device"])
        conv.config.x_center = LIVE_CHUNK_SECONDS
        conv.config.x_max = LIVE_CHUNK_SECONDS + 3
        conv.apply_conf(
            tag=model["id"],
            file_model=os.path.join(BASE, model["model"]),
            pitch_algo="rmvpe+",
            pitch_lvl=settings["pitch"],
            file_index=os.path.join(BASE, model["index"]) if model.get("index") else "",
            index_influence=settings["index_influence"],
            respiration_median_filtering=3,
            envelope_ratio=settings["rms_mix_rate"],
            consonant_breath_protection=settings["consonant_protection"],
        )
        audio, sample_rate = conv.generate_from_cache((samples, LIVE_SAMPLE_RATE), model["id"])

    if settings["output_gain_db"]:
        audio = np.clip(
            audio.astype(np.float32) * math.pow(10, settings["output_gain_db"] / 20),
            -32768,
            32767,
        ).astype(np.int16)
    return audio.astype("<i2", copy=False).tobytes(), sample_rate


@app.websocket("/live")
async def live_convert(websocket: WebSocket):
    origin = websocket.headers.get("origin", "")
    if origin and not re.fullmatch(r"http://(localhost|127\.0\.0\.1):\d+", origin):
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        try:
            settings = await websocket.receive_json()
        except ValueError:
            await websocket.send_json({"type": "error", "message": "Pengaturan RVC Live tidak valid."})
            await websocket.close(code=1008)
            return
        if not isinstance(settings, dict):
            await websocket.send_json({"type": "error", "message": "Pengaturan RVC Live tidak valid."})
            await websocket.close(code=1008)
            return
        try:
            require_premium(f"Bearer {settings.get('access_token', '')}")
        except HTTPException as exc:
            await websocket.send_json({"type": "error", "message": exc.detail})
            await websocket.close(code=1008)
            return
        model_id = settings.get("model_id") if isinstance(settings, dict) else None
        if not isinstance(model_id, str):
            model_id = None
        model = load_models().get(model_id)
        if not model:
            await websocket.send_json({"type": "error", "message": "Pilih model RVC yang tersedia dan terverifikasi."})
            await websocket.close(code=1008)
            return
        if not has_rvc():
            await websocket.send_json({"type": "error", "message": "Paket infer_rvc_python belum terpasang di server."})
            await websocket.close(code=1011)
            return

        try:
            options = {
                "pitch": int(settings.get("pitch", 0)),
                "input_gain_db": float(settings.get("input_gain_db", 0)),
                "output_gain_db": float(settings.get("output_gain_db", 0)),
                "index_influence": float(settings.get("index_influence", 0.66)),
                "rms_mix_rate": float(settings.get("rms_mix_rate", 0.25)),
                "consonant_protection": float(settings.get("consonant_protection", 0.33)),
                "device": str(settings.get("device", "auto")),
            }
        except (TypeError, ValueError):
            await websocket.send_json({"type": "error", "message": "Pengaturan RVC Live tidak valid."})
            await websocket.close(code=1008)
            return

        if not -12 <= options["pitch"] <= 12:
            await websocket.send_json({"type": "error", "message": "Tune harus antara -12 dan 12 semiton."})
            await websocket.close(code=1008)
            return
        if not -24 <= options["input_gain_db"] <= 12 or not -24 <= options["output_gain_db"] <= 12:
            await websocket.send_json({"type": "error", "message": "Gain harus antara -24 dan 12 dB."})
            await websocket.close(code=1008)
            return
        if not 0 <= options["index_influence"] <= 1 or not 0 <= options["rms_mix_rate"] <= 1:
            await websocket.send_json({"type": "error", "message": "Nilai index/RMS harus antara 0 dan 1."})
            await websocket.close(code=1008)
            return
        if not 0 <= options["consonant_protection"] <= 0.5:
            await websocket.send_json({"type": "error", "message": "Perlindungan konsonan harus antara 0 dan 0.5."})
            await websocket.close(code=1008)
            return
        if options["device"] not in {"auto", "cpu", "gpu"}:
            await websocket.send_json({"type": "error", "message": "Perangkat harus auto, cpu, atau gpu."})
            await websocket.close(code=1008)
            return

        await websocket.send_json({"type": "ready", "chunk_seconds": LIVE_CHUNK_SECONDS})
        queue = asyncio.Queue(maxsize=LIVE_QUEUE_SIZE)

        async def receive_chunks():
            try:
                while True:
                    message = await websocket.receive()
                    if message["type"] == "websocket.disconnect":
                        break
                    if message.get("text") is not None:
                        try:
                            control = json.loads(message["text"])
                        except ValueError:
                            await websocket.send_json({"type": "error", "message": "Pesan kontrol RVC Live tidak valid."})
                            break
                        if control.get("type") == "stop":
                            break
                        continue
                    chunk = message.get("bytes")
                    if chunk is None or len(chunk) > LIVE_CHUNK_BYTES or len(chunk) % 2:
                        await websocket.send_json({"type": "error", "message": "Format atau ukuran potongan audio Live tidak valid."})
                        break
                    await queue.put(chunk)
            except WebSocketDisconnect:
                pass
            finally:
                await queue.put(None)

        receiver = asyncio.create_task(receive_chunks())
        try:
            while True:
                chunk = await queue.get()
                if chunk is None:
                    break
                try:
                    audio, sample_rate = await asyncio.to_thread(convert_live_chunk, chunk, model, options)
                except Exception as exc:
                    logger.exception("RVC live conversion failed for model %s", model_id)
                    await websocket.send_json({"type": "error", "message": "Mesin RVC gagal memproses potongan audio. Periksa terminal server."})
                    await websocket.close(code=1011)
                    return
                try:
                    await websocket.send_json({"type": "audio", "sample_rate": sample_rate})
                    await websocket.send_bytes(audio)
                except (WebSocketDisconnect, RuntimeError):
                    return
            await websocket.send_json({"type": "done"})
            await websocket.close()
        finally:
            if not receiver.done():
                receiver.cancel()
                try:
                    await receiver
                except asyncio.CancelledError:
                    pass
    except WebSocketDisconnect:
        return
