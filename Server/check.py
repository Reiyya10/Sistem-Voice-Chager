"""Diagnosa pemasangan server RVC. Jalankan: python check.py"""
import importlib.util, os, shutil, sys, urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
def line(ok, text): print(("[OK] " if ok else "[X]  ") + text)

line(sys.version_info[:2] == (3, 10), f"Python {sys.version.split()[0]} (disarankan 3.10)")
line(shutil.which("ffmpeg") is not None, "ffmpeg ditemukan di PATH" if shutil.which("ffmpeg") else "ffmpeg TIDAK ditemukan (pasang: winget install ffmpeg, lalu buka terminal baru)")
for pkg in ["fastapi", "uvicorn", "multipart", "infer_rvc_python"]:
    ok = importlib.util.find_spec(pkg) is not None
    line(ok, f"paket {pkg} " + ("terpasang" if ok else "BELUM terpasang"))

print("\nModel (folder_info.json -> Models/*/model_info.json, dan models.json):")
sys.path.insert(0, BASE)
try:
    from main import scan_models
    data = scan_models()
except Exception as e:
    data = []; line(False, f"gagal membaca daftar model: {e}")
if not data: print("     (kosong) - hanya model 'demo' yang akan muncul di web")
for m in data:
    p = m["problems"]
    line(not p, f"{m['id']}: " + ("siap dipakai" if not p else "; ".join(p)))

print("\nServer di http://localhost:8000 :")
try:
    print("[OK] " + urllib.request.urlopen("http://localhost:8000/health", timeout=2).read().decode())
except Exception:
    print("[X]  server belum menyala (jalankan run.bat)")
