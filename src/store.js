import { reactive } from 'vue'

export const characters = [
  { id: 1, name: 'Robot Pelayan', tags: ['Robot', 'Dewasa'], rating: 4.2, votes: 125, bg: 'from-cyan-400 to-blue-600', premium: false },
  { id: 2, name: 'Narator Dalam', tags: ['Pria', 'Hangat'], rating: 4.5, votes: 2184, bg: 'from-violet-500 to-purple-800', premium: false },
  { id: 3, name: 'Android Neon', tags: ['Robot', 'Energik'], rating: 3.9, votes: 101, bg: 'from-fuchsia-500 to-pink-600', premium: false },
  { id: 4, name: 'Anak Ceria', tags: ['Anak', 'Ceria'], rating: 4.6, votes: 5269, bg: 'from-amber-300 to-orange-500', premium: false },
  { id: 5, name: 'Tetua Kosmik', tags: ['Fantasi', 'Tenang'], rating: 4.1, votes: 730, bg: 'from-indigo-400 to-violet-700', premium: true },
  { id: 6, name: 'Pendongeng Beludru', tags: ['Wanita', 'Hangat'], rating: 4.4, votes: 980, bg: 'from-rose-400 to-red-600', premium: true },
  { id: 7, name: 'Naga Mistis', tags: ['Fantasi', 'Gelap'], rating: 3.8, votes: 412, bg: 'from-emerald-400 to-teal-700', premium: true },
  { id: 8, name: 'Penyiar Retro', tags: ['Pria', 'Ceria'], rating: 4.0, votes: 660, bg: 'from-yellow-300 to-lime-600', premium: true },
]

export const plans = [
  { id: 'gratis', name: 'Gratis', monthly: 0, features: ['10 menit per bulan', '20 karakter dasar', 'Ekspor MP3', 'Ada watermark'] },
  { id: 'pro', name: 'Pro', monthly: 49000, popular: true, features: ['300 menit per bulan', 'Semua karakter', 'Mode Ultra Cepat', 'Ekspor WAV dan MP3', 'Tanpa watermark'] },
  { id: 'studio', name: 'Studio', monthly: 99000, features: ['1.500 menit per bulan', 'Semua fitur Pro', 'Prioritas pemrosesan', '10 karakter custom', 'Lisensi komersial'] },
]

export const store = reactive({
  loggedIn: false,
  plan: 'gratis',
  credits: 10,
  selected: characters[0],
  toastMsg: '',
})

export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
export const isLocked = (c) => c.premium && store.plan === 'gratis'

let timer
export function toast(msg) {
  store.toastMsg = msg
  clearTimeout(timer)
  timer = setTimeout(() => (store.toastMsg = ''), 2500)
}
