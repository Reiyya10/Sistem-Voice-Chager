const SR = 22050

const impulse = (ctx) => {
  const len = Math.floor(SR * 1.5), b = ctx.createBuffer(1, len, SR), d = b.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  return b
}

function shift(inp, pitch) {
  const N = 8192, W = 2048, buf = new Float32Array(N), out = new Float32Array(inp.length)
  let w = 0, d = 0
  const step = 1 - pitch
  const read = (dl) => { let pos = w - dl; if (pos < 0) pos += N; const k = Math.floor(pos), f = pos - k; return buf[k] * (1 - f) + buf[(k + 1) % N] * f }
  for (let n = 0; n < inp.length; n++) {
    buf[w] = inp[n]
    const d2 = (d + W / 2) % W
    out[n] = read(d) * Math.sin((Math.PI * d) / W) + read(d2) * Math.sin((Math.PI * d2) / W)
    d += step
    if (d >= W) d -= W; else if (d < 0) d += W
    w = (w + 1) % N
  }
  return out
}

async function toMono(blob) {
  const ac = new (window.AudioContext || window.webkitAudioContext)()
  const buf = await ac.decodeAudioData(await blob.arrayBuffer())
  ac.close()
  const off = new OfflineAudioContext(1, Math.ceil(buf.duration * SR), SR)
  const s = off.createBufferSource()
  s.buffer = buf; s.connect(off.destination); s.start()
  return (await off.startRendering()).getChannelData(0)
}

function encodeWav(data) {
  const b = new ArrayBuffer(44 + data.length * 2), v = new DataView(b)
  const t = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  t(0, 'RIFF'); v.setUint32(4, 36 + data.length * 2, true); t(8, 'WAVEfmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  t(36, 'data'); v.setUint32(40, data.length * 2, true)
  for (let i = 0; i < data.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true)
  return new Blob([b], { type: 'audio/wav' })
}

export const blobToDataURL = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob) })

// p: { pitch, robot, echo, reverb, volume }
export async function processAudio(blob, p) {
  let data = await toMono(blob)
  if (Math.abs(p.pitch - 100) > 1) data = shift(data, p.pitch / 100)
  if (p.robot) data = data.map((v, i) => v * Math.sin((2 * Math.PI * 60 * i) / SR))
  const tail = p.echo > 0 || p.reverb > 0 ? SR * 2 : 0
  const off = new OfflineAudioContext(1, data.length + tail, SR)
  const b = off.createBuffer(1, data.length, SR)
  b.copyToChannel(data, 0)
  const src = off.createBufferSource(), dry = off.createGain(), master = off.createGain()
  src.buffer = b; master.gain.value = p.volume / 100
  src.connect(dry); dry.connect(master)
  if (p.echo > 0) {
    const dl = off.createDelay(1), fb = off.createGain(), wet = off.createGain()
    dl.delayTime.value = 0.22; fb.gain.value = 0.4; wet.gain.value = (p.echo / 100) * 0.8
    src.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master)
  }
  if (p.reverb > 0) {
    const cv = off.createConvolver(), wet = off.createGain()
    cv.buffer = impulse(off); wet.gain.value = p.reverb / 100
    src.connect(cv); cv.connect(wet); wet.connect(master)
  }
  master.connect(off.destination); src.start()
  return encodeWav((await off.startRendering()).getChannelData(0))
}
