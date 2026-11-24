# Server RVC SuaraKu

## Menjalankan
    python -m venv venv
    venv\Scripts\activate
    python -m pip install "pip>=24" "setuptools<=80.6.0"
    python -m pip install -r requirements.txt
    uvicorn main:app --port 8000

Di Windows, jalankan `setup.bat` satu kali untuk memasang dependensi, lalu `run.bat`
untuk menyalakan server. Untuk mendiagnosis model dan dependensi, jalankan
`python check.py` dari folder `Server`. Dependensi membatasi NumPy ke versi di bawah 2
agar kompatibel dengan `pyworld` yang dipakai oleh inferensi RVC.

## Mengaktifkan model

Daftar model bawaan dibaca dari `folder_info.json` dan `Models/<grup>/model_info.json`.
Setiap entri model yang ingin digunakan harus memiliki `owner` (nama pemilik/pemberi izin)
dan `consent_verified: true`, selain file `.pth` yang tercantum di `model_path`.
Tambahkan metadata itu hanya untuk suara yang memang kamu miliki atau sudah mendapat
izin pemiliknya. Contoh entri:

    "suara-saya": {
      "enable": true,
      "model_path": "suara-saya.pth",
      "title": "Suara Saya",
      "feature_retrieval_library": "suara-saya.index",
      "owner": "Nama pemilik suara",
      "consent_verified": true,
      "license": "Milik sendiri"
    }

Taruh file model dan index di folder model tersebut. Index opsional. `Models/Models.json`
tidak digunakan oleh server; format daftar model lama, jika diperlukan, berada di
`Server/models.json` dan tetap memerlukan `owner` serta `consent_verified: true`.

## Menghubungkan ke web

1. Jika baru mengubah dependensi atau metadata model, hentikan server lama dan jalankan
   ulang `Server/run.bat`; setelah perubahan dependensi, jalankan `Server/setup.bat` dulu.
   Biarkan terminal server tetap terbuka.
2. Pastikan `http://localhost:8000/health` menampilkan status `ok`.
3. Jalankan web dari folder proyek dengan `npm run dev`, lalu buka `/voice-changer`.
4. Pilih model yang terverifikasi melalui halaman **Karakter**, lalu gunakan di **Voice Changer**.
   Tab **Live** mengonversi audio dalam potongan 6 detik dan membutuhkan koneksi WebSocket;
   hasil awal memiliki jeda beberapa detik. Untuk Live, mulai ulang server setelah memasang
   dependensi yang diperbarui.

## Akun dan Premium

Server menyimpan akun, session, paket, dan masa aktif Premium di `Server/suaraku.db`
(SQLite). Registrasi dan login tersedia melalui API `/auth/register` dan `/auth/login`.
Endpoint RVC `/convert` dan `/live` hanya menerima pengguna dengan Premium aktif.
Pembelian melalui `/payments/demo` adalah simulasi. Untuk produksi, ganti endpoint
tersebut dengan verifikasi webhook gateway pembayaran nyata.

Jika belum ada model terverifikasi, server hanya menampilkan model demo (perlu ffmpeg).
Demo dipakai untuk menguji alur upload dan pemutaran hasil, bukan konversi AI.

## Pengaturan RVC di web

- **Gain input/output** mengubah level audio sebelum dan sesudah konversi, dalam dB.
- **Tune** menggeser pitch model dalam semiton, dari -12 sampai +12.
- **Ukuran chunk** mengatur interval pemrosesan internal (10-40 detik); bagian audio
  pendek tetap diproses sebagai satu chunk.
- **Extra RVC** menyediakan index influence, RMS mix, dan consonant protection.
- **Perangkat inferensi** dapat memilih Otomatis, CPU, atau GPU CUDA. GPU hanya aktif
  jika server mendeteksi perangkat CUDA yang tersedia. Endpoint `/health` mengembalikan
  `gpu_available` dan `gpu_name`.
