// Klien untuk server RVC (lihat folder server/). Alamat bisa diubah lewat .env: VITE_RVC_URL
const configuredBase = import.meta.env.VITE_RVC_URL
const browserHost = window.location.hostname || 'localhost'
const BASE = configuredBase || (import.meta.env.DEV
  ? '/api'
  : `${window.location.protocol}//${browserHost}:8000`)
const coverAssets = import.meta.glob('../../Server/Models/**/cover.png', { eager: true, query: '?url', import: 'default' })

export async function rvcStatus() {
  try {
    const r = await fetch(BASE + '/health')
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export async function rvcHealth() { return Boolean(await rvcStatus()) }

export async function rvcModels() {
  const r = await fetch(BASE + '/models')
  if (!r.ok) throw new Error('Gagal memuat daftar model')
  return r.json()
}

export function rvcModelCoverUrl(modelId) {
  const [group, character] = modelId.split('/')
  return coverAssets[`../../Server/Models/${group}/${character}/cover.png`] || ''
}

export function rvcLiveUrl() {
  const url = new URL(BASE, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = `${url.pathname.replace(/\/$/, '')}/live`
  return url.toString()
}

export async function rvcConvert(blob, modelId, settings = {}) {
  const fd = new FormData()
  fd.append('audio', blob, 'input.wav')
  fd.append('model_id', modelId)
  fd.append('pitch', String(settings.pitch ?? 0))
  fd.append('input_gain_db', String(settings.inputGainDb ?? 0))
  fd.append('output_gain_db', String(settings.outputGainDb ?? 0))
  fd.append('chunk_seconds', String(settings.chunkSeconds ?? 30))
  fd.append('index_influence', String(settings.indexInfluence ?? 0.85))
  fd.append('rms_mix_rate', String(settings.rmsMixRate ?? 0.25))
  fd.append('consonant_protection', String(settings.consonantProtection ?? 0.35))
  fd.append('device', String(settings.device ?? 'auto'))
  fd.append('silent_threshold', String(settings.silentThreshold ?? 0.00001))
  fd.append('silence_front', String(settings.silenceFront ?? 1))
  fd.append('rvc_quality', String(settings.rvcQuality ?? 1))
  let r
  const token = settings.accessToken
  try {
    r = await fetch(BASE + '/convert', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
  } catch (error) {
    throw new Error(`Tidak dapat menghubungi server RVC di ${BASE}. Pastikan Server\\run.bat aktif dan coba muat ulang halaman.`)
  }
  if (!r.ok) {
    const body = await r.text()
    let message = `Konversi gagal (${r.status})`
    try {
      const error = JSON.parse(body)
      if (typeof error.detail === 'string') message = error.detail
      else if (body) message = body
    } catch {
      if (body) message = body
    }
    throw new Error(message)
  }
  const result = await r.blob()
  if (!result.size) throw new Error('Server RVC mengirim hasil audio kosong.')
  return result
}
