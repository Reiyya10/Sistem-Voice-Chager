<script setup>
import { ref, onBeforeUnmount } from 'vue'
const emit = defineEmits(['done'])
const rec = ref(false), sec = ref(0)
let t
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
function toggle() {
  if (!rec.value) { sec.value = 0; rec.value = true; t = setInterval(() => sec.value++, 1000) }
  else { clearInterval(t); rec.value = false; emit('done', sec.value) }
}
onBeforeUnmount(() => clearInterval(t))
</script>
<template>
  <div class="card flex flex-col items-center gap-4">
    <button class="flex h-24 w-24 items-center justify-center rounded-full text-3xl text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      :class="rec ? 'animate-pulse bg-red-500' : 'bg-violet-600 hover:bg-violet-700'" :aria-label="rec ? 'Berhenti merekam' : 'Mulai merekam'" @click="toggle">
      <i class="fa-solid" :class="rec ? 'fa-stop' : 'fa-microphone'"></i>
    </button>
    <p class="font-mono text-2xl">{{ fmt(sec) }}</p>
    <p class="text-sm text-slate-400">{{ rec ? 'Merekam... tekan untuk berhenti' : 'Tekan untuk merekam' }}</p>
  </div>
</template>
