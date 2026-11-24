import { reactive, watch } from 'vue'

export const characters = [
  { id: 1, name: 'Robot Pelayan', tags: ['Robot', 'Dewasa'], rating: 4.2, votes: 125, bg: 'from-cyan-400 to-blue-600', premium: false, preset: 'robot' },
  { id: 2, name: 'Narator Dalam', tags: ['Pria', 'Hangat'], rating: 4.5, votes: 2184, bg: 'from-violet-500 to-purple-800', premium: false, preset: 'dalam' },
  { id: 3, name: 'Android Neon', tags: ['Robot', 'Energik'], rating: 3.9, votes: 101, bg: 'from-fuchsia-500 to-pink-600', premium: false, preset: 'neon' },
  { id: 4, name: 'Anak Ceria', tags: ['Anak', 'Ceria'], rating: 4.6, votes: 5269, bg: 'from-amber-300 to-orange-500', premium: false, preset: 'ceria' },
  { id: 9, name: 'Gadis Gaya Anime', tags: ['Anime', 'Wanita'], rating: 4.7, votes: 3120, bg: 'from-pink-300 to-rose-500', premium: false, preset: 'animeGirl' },
  { id: 10, name: 'Chibi Imut', tags: ['Anime', 'Anak'], rating: 4.3, votes: 1410, bg: 'from-sky-300 to-indigo-500', premium: false, preset: 'chibi' },
  { id: 13, name: 'Penyiar Berita', tags: ['Tokoh', 'Formal'], rating: 4.1, votes: 540, bg: 'from-slate-400 to-slate-700', premium: false, preset: 'penyiar' },
  { id: 5, name: 'Tetua Kosmik', tags: ['Fantasi', 'Tenang'], rating: 4.1, votes: 730, bg: 'from-indigo-400 to-violet-700', premium: false, preset: 'kosmik' },
  { id: 6, name: 'Pendongeng Beludru', tags: ['Wanita', 'Hangat'], rating: 4.4, votes: 980, bg: 'from-rose-400 to-red-600', premium: false, preset: 'beludru' },
  { id: 7, name: 'Naga Mistis', tags: ['Fantasi', 'Gelap'], rating: 3.8, votes: 412, bg: 'from-emerald-400 to-teal-700', premium: false, preset: 'naga' },
  { id: 8, name: 'Penyiar Retro', tags: ['Pria', 'Ceria'], rating: 4.0, votes: 660, bg: 'from-yellow-300 to-lime-600', premium: false, preset: 'retro' },
  { id: 11, name: 'Pahlawan Gagah', tags: ['Anime', 'Pria'], rating: 4.5, votes: 1890, bg: 'from-red-400 to-orange-600', premium: false, preset: 'pahlawan' },
  { id: 12, name: 'Orator Tegas', tags: ['Tokoh', 'Formal'], rating: 4.2, votes: 620, bg: 'from-teal-400 to-cyan-700', premium: false, preset: 'orator' },
]

export const plans = [
  { id: 'premium-1-month', name: 'Premium 1 Bulan', months: 1, monthly: 49000, popular: false, features: ['Akses semua model RVC', 'Voice changer Live', 'Ekspor audio', 'Aktif 30 hari'] },
  { id: 'premium-1-year', name: 'Premium 1 Tahun', months: 12, monthly: 499000, popular: true, features: ['Akses semua model RVC', 'Voice changer Live', 'Ekspor audio', 'Aktif 365 hari', 'Lebih hemat dari paket bulanan'] },
]

const KEY = 'suaraku-state'
const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV
  ? '/api'
  : `${window.location.protocol}//${window.location.hostname || 'localhost'}:8000`)
const RECORDING_DB = 'suaraku-recordings'
const RECORDING_STORE = 'recordings'
let saved = {}
try { saved = JSON.parse(localStorage.getItem(KEY)) || {} } catch { saved = {} }

function openRecordingDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB tidak didukung browser ini.'))
      return
    }
    const request = indexedDB.open(RECORDING_DB, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(RECORDING_STORE)) db.createObjectStore(RECORDING_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadRecordingBlobs() {
  try {
    const db = await openRecordingDb()
    const rows = await new Promise((resolve, reject) => {
      const request = db.transaction(RECORDING_STORE, 'readonly').objectStore(RECORDING_STORE).getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
    db.close()
    store.recordings = rows
      .sort((a, b) => b.id - a.id)
      .map((row) => ({ ...row, url: URL.createObjectURL(row.blob) }))
  } catch {
    store.recordings = Array.isArray(saved.recordings) ? saved.recordings : []
  }
}

export const store = reactive({
  loggedIn: saved.loggedIn || false,
  userName: saved.userName || '',
  userEmail: saved.userEmail || '',
  premium: saved.premium || false,
  premiumUntil: saved.premiumUntil || '',
  accessToken: saved.accessToken || '',
  selected: characters.find((c) => c.id === saved.selectedId) || characters[0],
  rvcModelId: saved.rvcModelId || '',
  rvcModelName: saved.rvcModelName || '',
  rvcModelOwner: saved.rvcModelOwner || '',
  recordings: saved.recordings || [],
  toastMsg: '',
})

loadRecordingBlobs()

watch(() => ({
  loggedIn: store.loggedIn,
  userName: store.userName,
  userEmail: store.userEmail,
  premium: store.premium,
  premiumUntil: store.premiumUntil,
  accessToken: store.accessToken,
  selectedId: store.selected.id,
  rvcModelId: store.rvcModelId,
  rvcModelName: store.rvcModelName,
  rvcModelOwner: store.rvcModelOwner,
}), (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)) }
  catch { /* preferensi utama tetap di IndexedDB */ }
}, { deep: true })

export async function addRecording(r) {
  const row = { ...r, blob: r.blob }
  try {
    const db = await openRecordingDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDING_STORE, 'readwrite')
      tx.objectStore(RECORDING_STORE).put(row)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    toast(error.message || 'Rekaman tidak dapat disimpan.')
  }
  store.recordings.unshift({ ...row, url: URL.createObjectURL(row.blob) })
}

export async function removeRecording(id) {
  try {
    const db = await openRecordingDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDING_STORE, 'readwrite')
      tx.objectStore(RECORDING_STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  } catch (error) {
    toast(error.message || 'Rekaman tidak dapat dihapus.')
  }
  const removed = store.recordings.find((recording) => recording.id === id)
  if (removed?.url?.startsWith('blob:')) URL.revokeObjectURL(removed.url)
  store.recordings = store.recordings.filter((recording) => recording.id !== id)
}

export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
export const isPremium = () => store.loggedIn && store.premium

export async function apiRegister(name, email, password) {
  const body = new FormData()
  body.append('name', name)
  body.append('email', email)
  body.append('password', password)
  return authRequest('/auth/register', body)
}

export async function apiLogin(email, password) {
  const body = new FormData()
  body.append('email', email)
  body.append('password', password)
  return authRequest('/auth/login', body)
}

async function authRequest(path, body) {
  let response
  try { response = await fetch(API + path, { method: 'POST', body }) }
  catch { throw new Error('Tidak dapat menghubungi server.') }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'Permintaan gagal.')
  applyAuth(data)
  return data
}

export function applyAuth(data) {
  store.loggedIn = true
  store.accessToken = data.token
  applyUser(data.user)
}

export function applyUser(user) {
  store.loggedIn = Boolean(user)
  store.userName = user?.name || ''
  store.userEmail = user?.email || ''
  store.premium = Boolean(user?.premium)
  store.premiumUntil = user?.premium_until || ''
}

export async function apiAccount() {
  if (!store.accessToken) return
  try {
    const response = await fetch(API + '/auth/account', { headers: { Authorization: `Bearer ${store.accessToken}` } })
    if (response.status === 401) { await apiLogout(false); return }
    if (!response.ok) return
    applyUser(await response.json())
  } catch { /* akun tetap memakai data lokal tersimpan */ }
}

export async function apiLogout(clear = true) {
  if (store.accessToken) {
    try { await fetch(API + '/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${store.accessToken}` } }) } catch {}
  }
  if (clear) {
    store.loggedIn = false
    store.accessToken = ''
    store.userName = ''
    store.userEmail = ''
    store.premium = false
    store.premiumUntil = ''
  }
}

export async function apiPurchasePremium(months) {
  const body = new FormData()
  body.append('months', String(months))
  const response = await fetch(API + '/payments/demo', {
    method: 'POST',
    headers: { Authorization: `Bearer ${store.accessToken}` },
    body,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'Pembelian gagal.')
  applyUser(data.user)
  return data
}

let timer
export function toast(msg) {
  store.toastMsg = msg
  clearTimeout(timer)
  timer = setTimeout(() => (store.toastMsg = ''), 2500)
}
