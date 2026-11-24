import { onBeforeUnmount, ref } from 'vue'
import { rvcLiveUrl } from '../Audio/rvc.js'

const SAMPLE_RATE = 16000
const CHUNK_SECONDS = 6
const CHUNK_SAMPLES = SAMPLE_RATE * CHUNK_SECONDS
const MIN_CHUNK_SAMPLES = SAMPLE_RATE
const CHUNK_BYTES = CHUNK_SAMPLES * 2

export function useLiveRvc() {
  const live = ref(false), stopping = ref(false), error = ref(''), level = ref(0), latency = ref(0)
  let socket, context, stream, source, processor, mute, outputRate = 0
  let inputPosition = 0, previousInput = 0, pending = new Int16Array(CHUNK_SAMPLES), pendingLength = 0
  let nextOutputTime = 0
  const sentAt = []

  function releaseInput() {
    if (processor) {
      processor.onaudioprocess = null
      processor.disconnect()
    }
    source?.disconnect()
    mute?.disconnect()
    stream?.getTracks().forEach((track) => track.stop())
    processor = null; source = null; mute = null; stream = null
  }

  function releaseContext() {
    const audio = context
    context = null
    if (audio && audio.state !== 'closed') audio.close()
  }

  function fail(message) {
    error.value = message
    live.value = false
    stopping.value = false
    releaseInput()
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
    releaseContext()
  }

  function playPcm(buffer) {
    if (!context || !outputRate) return
    const view = new DataView(buffer)
    const samples = new Float32Array(buffer.byteLength / 2)
    for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768
    if (!samples.length) return
    const audio = context.createBuffer(1, samples.length, outputRate)
    audio.copyToChannel(samples, 0)
    const player = context.createBufferSource()
    player.buffer = audio
    player.connect(context.destination)
    const startAt = Math.max(context.currentTime + 0.12, nextOutputTime)
    player.start(startAt)
    nextOutputTime = startAt + audio.duration
    const started = sentAt.shift()
    if (started) latency.value = Math.max(0, Math.round(performance.now() - started))
  }

  function sendChunk(samples) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    if (socket.bufferedAmount > CHUNK_BYTES * 2) {
      fail('Server RVC tertinggal dari audio Live. Coba gunakan GPU atau hentikan sesi lalu mulai lagi.')
      return false
    }
    socket.send(samples.buffer)
    sentAt.push(performance.now())
    return true
  }

  function handleAudio(event) {
    if (!context || !live.value) return
    const input = event.inputBuffer.getChannelData(0)
    let sum = 0
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
    level.value = Math.min(100, Math.sqrt(sum / input.length) * 300)

    const ratio = context.sampleRate / SAMPLE_RATE
    const converted = []
    let position = inputPosition
    while (position < input.length) {
      const index = Math.floor(position)
      if (index + 1 >= input.length) break
      const fraction = position - index
      const first = index < 0 ? previousInput : input[index]
      const second = index + 1 < 0 ? previousInput : input[index + 1]
      converted.push(first + (second - first) * fraction)
      position += ratio
    }
    inputPosition = position - input.length
    previousInput = input[input.length - 1] || 0

    for (const sample of converted) {
      pending[pendingLength++] = Math.round(Math.max(-1, Math.min(1, sample)) * 32767)
      if (pendingLength === CHUNK_SAMPLES) {
        sendChunk(pending)
        pending = new Int16Array(CHUNK_SAMPLES)
        pendingLength = 0
        if (!live.value) return
      }
    }
  }

  function connect(modelId, settings) {
    return new Promise((resolve, reject) => {
      socket = new WebSocket(rvcLiveUrl())
      socket.binaryType = 'arraybuffer'
      let ready = false
      socket.onopen = () => {
        socket.send(JSON.stringify({
          model_id: modelId,
          access_token: settings.accessToken ?? '',
          pitch: settings.pitch ?? 0,
          input_gain_db: settings.inputGainDb ?? 0,
          output_gain_db: settings.outputGainDb ?? 0,
          index_influence: settings.indexInfluence ?? 0.66,
          rms_mix_rate: settings.rmsMixRate ?? 0.25,
          consonant_protection: settings.consonantProtection ?? 0.33,
          device: settings.device ?? 'auto',
        }))
      }
      socket.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          playPcm(event.data)
          return
        }
        let message
        try { message = JSON.parse(event.data) }
        catch { fail('Respons server RVC Live tidak valid.'); return }
        if (message.type === 'ready') {
          ready = true
          resolve(message)
        } else if (message.type === 'audio') {
          outputRate = message.sample_rate
        } else if (message.type === 'error') {
          if (!ready) reject(new Error(message.message))
          else fail(message.message)
        } else if (message.type === 'done') {
          stopping.value = false
        }
      }
      socket.onerror = () => {
        const message = 'Tidak dapat terhubung ke server RVC Live. Pastikan server telah dimulai ulang.'
        if (!ready) reject(new Error(message))
        else fail(message)
      }
      socket.onclose = () => {
        if (!ready && !error.value) reject(new Error('Koneksi RVC Live ditutup sebelum siap.'))
        if (live.value && !stopping.value) error.value = 'Koneksi RVC Live terputus.'
        live.value = false; stopping.value = false; level.value = 0
        releaseInput()
        releaseContext()
      }
    })
  }

  async function start(modelId, settings = {}) {
    error.value = ''
    latency.value = 0
    sentAt.length = 0
    if (!modelId) { error.value = 'Pilih model RVC dari halaman Karakter terlebih dahulu.'; return }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!navigator.mediaDevices?.getUserMedia || !AudioContextClass) {
      error.value = 'Browser tidak mendukung mikrofon atau Web Audio. Pakai Chrome atau Edge melalui localhost atau HTTPS.'
      return
    }
    try {
      await connect(modelId, settings)
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false },
      })
      context = new AudioContextClass({ latencyHint: 'interactive' })
      await context.resume()
      source = context.createMediaStreamSource(stream)
      processor = context.createScriptProcessor(4096, 1, 1)
      mute = context.createGain()
      mute.gain.value = 0
      processor.onaudioprocess = handleAudio
      source.connect(processor)
      processor.connect(mute)
      mute.connect(context.destination)
      live.value = true
      nextOutputTime = context.currentTime + 0.12
    } catch (e) {
      error.value = e.message || 'Gagal memulai RVC Live.'
      releaseInput()
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
      releaseContext()
    }
  }

  function stop(drain = true) {
    releaseInput()
    live.value = false
    level.value = 0
    if (drain && socket?.readyState === WebSocket.OPEN) {
      if (pendingLength >= MIN_CHUNK_SAMPLES && !sendChunk(pending.slice(0, pendingLength))) return
      pendingLength = 0
      if (socket.readyState !== WebSocket.OPEN) return
      socket.send(JSON.stringify({ type: 'stop' }))
      stopping.value = true
      return
    }
    stopping.value = false
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
    releaseContext()
  }

  onBeforeUnmount(() => stop(false))
  return { live, stopping, error, level, latency, start, stop }
}
