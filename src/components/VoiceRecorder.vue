<script setup>
import { ref, onBeforeUnmount } from 'vue'
const emit = defineEmits(['done'])
const rec = ref(false), sec = ref(0), err = ref('')
let t, mr, stream, chunks = []
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
function stop() { clearInterval(t); rec.value = false; if (mr && mr.state !== 'inactive') mr.stop() }
async function toggle() {
  if (rec.value) return stop()
  err.value = ''
  if (!window.isSecureContext) { err.value = 'Perekaman perlu HTTPS tepercaya. Buka alamat HTTPS aplikasi; localhost hanya berlaku di perangkat yang menjalankan browser.'; return }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { err.value = 'Browser tidak mendukung perekaman. Pakai Chrome atau Edge lewat localhost atau HTTPS.'; return }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      },
    })
  }
  catch (error) {
    err.value = error.name === 'NotAllowedError'
      ? 'Izin mikrofon ditolak. Izinkan mikrofon untuk situs ini di pengaturan browser.'
      : 'Mikrofon tidak tersedia atau sedang digunakan aplikasi lain.'
    return
  }
  chunks = []
  mr = new MediaRecorder(stream)
  mr.ondataavailable = (e) => chunks.push(e.data)
  mr.onstop = () => { stream.getTracks().forEach((x) => x.stop()); emit('done', new Blob(chunks, { type: mr.mimeType }), sec.value) }
  mr.start(); sec.value = 0; rec.value = true
  t = setInterval(() => { sec.value++ }, 1000)
}
onBeforeUnmount(stop)
</script>
<template>
  <div class="card flex flex-col items-center gap-4">
    <button class="flex h-24 w-24 items-center justify-center rounded-full text-3xl text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      :class="rec ? 'animate-pulse bg-red-500' : 'bg-violet-600 hover:bg-violet-700'" :aria-label="rec ? 'Berhenti merekam' : 'Mulai merekam'" @click="toggle">
      <i class="fa-solid" :class="rec ? 'fa-stop' : 'fa-microphone'"></i>
    </button>
    <p class="font-mono text-2xl">{{ fmt(sec) }}</p>
    <p class="text-sm text-slate-400">{{ rec ? 'Merekam... tekan untuk berhenti' : 'Tekan untuk merekam' }}</p>
    <p v-if="err" role="alert" class="text-sm text-red-400">{{ err }}</p>
  </div>
</template>
