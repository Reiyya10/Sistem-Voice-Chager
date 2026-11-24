# SuaraKu - AI Voice Changer (Vue 3 + Tailwind CSS)

Project tugas IPPL. Vue 3 (Composition API), Vue Router (hash mode, 8 route), Tailwind CSS v4, Font Awesome.
Data, pemrosesan suara, dan pembayaran adalah simulasi (mode demo).
Efek suara browser tersedia gratis. Model RVC memerlukan akun Premium aktif selama
1 bulan atau 1 tahun. Kredit dan watermark tidak digunakan.

## Menjalankan
    npm install
    npm run dev        # buka http://localhost:5173
    npm run build      # hasil di folder dist/

Pilih model AI (RVC) melalui tab **Model AI (RVC)** pada halaman Karakter.
Perekaman tidak berhenti otomatis. Tab **Live** memakai efek browser seperti biasa,
atau mengirim audio ke model RVC per potongan 6 detik bila model RVC dipilih.
RVC Live membutuhkan server yang sudah dimulai ulang dan dapat tertinggal bila inferensi
lebih lambat daripada audio yang masuk.

## Route
/  /voice-changer  /karakter  /rekaman  /tentang  /masuk  /langganan  /akun (perlu login)

## Struktur
src/components : AppHeader, AppFooter, HeroSection, CharacterCard, CharacterModal, VoiceRecorder,
                 AudioPlayer, EffectSlider, PricingCard, ConfirmDialog, ToastNotification
src/views      : 8 halaman
src/store.js   : state (plan, credits, karakter terpilih)

## Upload ke GitHub
    git init && git add . && git commit -m "Initial commit: SuaraKu"
    git branch -M main
    git remote add origin https://github.com/USERNAME/suaraku.git
    git push -u origin main
