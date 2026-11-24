import { ref, reactive, watch, onBeforeUnmount } from 'vue'

// Pitch shifter sederhana (dua "tap" delay dengan crossfade) berbasis ScriptProcessor.
function createShifter(ctx) {
  const node = ctx.createScriptProcessor(1024, 1, 1)
  const N = 8192, W = 2048
  const buf = new Float32Array(N)
  let w = 0, d = 0
  node.pitch = 1
  const read = (dl) => {
    let pos = w - dl
    if (pos < 0) pos += N
    const k = Math.floor(pos), f = pos - k
    return buf[k] * (1 - f) + buf[(k + 1) % N] * f
  }
  node.onaudioprocess = (e) => {
    const inp = e.inputBuffer.getChannelData(0)
    const out = e.outputBuffer.getChannelData(0)
    const step = 1 - node.pitch
    for (let n = 0; n < inp.length; n++) {
      buf[w] = inp[n]
      const d2 = (d + W / 2) % W
      out[n] = read(d) * Math.sin((Math.PI * d) / W) + read(d2) * Math.sin((Math.PI * d2) / W)
      d += step
      if (d >= W) d -= W
      else if (d < 0) d += W
      w = (w + 1) % N
    }
  }
  return node
}

function makeImpulse(ctx) {
  const len = Math.floor(ctx.sampleRate * 1.5)
  const b = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = b.getChannelData(c)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  }
  return b
}

export function useLiveVoice() {
  const live = ref(false), error = ref(''), level = ref(0), latency = ref(0)
  // pitch 100 = normal. echo, reverb: 0-100. volume: 0-150.
  const p = reactive({ pitch: 100, robot: false, echo: 0, reverb: 0, volume: 100 })
  let ctx, stream, n = {}, raf

  function apply() {
    if (!ctx) return
    n.ps.pitch = p.pitch / 100
    n.ring.gain.value = p.robot ? 0 : 1
    n.oscGain.gain.value = p.robot ? 1 : 0
    n.echoWet.gain.value = (p.echo / 100) * 0.8
    n.revWet.gain.value = p.reverb / 100
    n.master.gain.value = p.volume / 100
  }
  watch(p, apply, { deep: true })

  function meter() {
    const data = new Uint8Array(n.an.fftSize)
    n.an.getByteTimeDomainData(data)
    let sum = 0
    for (const v of data) sum += ((v - 128) / 128) ** 2
    level.value = Math.min(100, Math.sqrt(sum / data.length) * 300)
    raf = requestAnimationFrame(meter)
  }

  async function start() {
    error.value = ''
    if (!window.isSecureContext) {
      error.value = 'Mode Live perlu HTTPS tepercaya. Buka alamat HTTPS aplikasi; localhost hanya berlaku di perangkat yang menjalankan browser.'
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = 'Browser tidak mendukung mikrofon. Pakai Chrome atau Edge lewat localhost atau HTTPS.'
      return
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } })
    } catch (e) {
      error.value = e.name === 'NotAllowedError'
        ? 'Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.'
        : 'Mikrofon tidak tersedia atau sedang digunakan aplikasi lain.'
      return
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' })
    const src = ctx.createMediaStreamSource(stream)
    const ps = createShifter(ctx)
    const ring = ctx.createGain(), osc = ctx.createOscillator(), oscGain = ctx.createGain()
    osc.frequency.value = 60
    osc.connect(oscGain); oscGain.connect(ring.gain); osc.start()
    const dry = ctx.createGain()
    const delay = ctx.createDelay(1), fb = ctx.createGain(), echoWet = ctx.createGain()
    delay.delayTime.value = 0.22; fb.gain.value = 0.4
    const conv = ctx.createConvolver(), revWet = ctx.createGain()
    conv.buffer = makeImpulse(ctx)
    const master = ctx.createGain(), an = ctx.createAnalyser()
    an.fftSize = 256

    src.connect(ps); ps.connect(ring); ring.connect(dry); dry.connect(master)
    ring.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(echoWet); echoWet.connect(master)
    ring.connect(conv); conv.connect(revWet); revWet.connect(master)
    master.connect(an); an.connect(ctx.destination)

    n = { ps, ring, oscGain, echoWet, revWet, master, an }
    apply()
    latency.value = Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0) + 2048 / ctx.sampleRate) * 1000)
    live.value = true
    meter()
  }

  function stop() {
    cancelAnimationFrame(raf)
    stream?.getTracks().forEach((t) => t.stop())
    ctx?.close()
    ctx = null; stream = null; live.value = false; level.value = 0
  }
  onBeforeUnmount(stop)

  return { live, error, level, latency, p, start, stop }
}
