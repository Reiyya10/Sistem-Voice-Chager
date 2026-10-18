<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { store, toast } from '../store'
defineProps({ ready: Boolean, busy: Boolean })
const playing = ref(false), pos = ref(0)
let t
function play() {
  if (playing.value) { clearInterval(t); playing.value = false; return }
  playing.value = true
  t = setInterval(() => { pos.value += 2; if (pos.value >= 100) { pos.value = 0; clearInterval(t); playing.value = false } }, 100)
}
onBeforeUnmount(() => clearInterval(t))
</script>
<template>
  <div class="card">
    <h3 class="mb-3 font-bold">Hasil Suara</h3>
    <p v-if="busy" class="animate-pulse text-violet-300">Mengubah suara...</p>
    <p v-else-if="!ready" class="text-slate-400">Belum ada hasil. Rekam atau unggah audio, lalu tekan Ubah Suara.</p>
    <template v-else>
      <div class="flex items-center gap-4">
        <button class="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600" :aria-label="playing ? 'Jeda' : 'Putar'" @click="play"><i class="fa-solid" :class="playing ? 'fa-pause' : 'fa-play'"></i></button>
        <div class="h-2 flex-1 rounded-full bg-slate-700"><div class="h-2 rounded-full bg-violet-500" :style="{ width: pos + '%' }"></div></div>
        <i class="fa-solid fa-volume-high text-slate-400"></i>
      </div>
      <div class="mt-4 flex gap-3">
        <button class="btn-ghost" @click="toast('Mengunduh hasil...')"><i class="fa-solid fa-download"></i> Unduh</button>
        <button class="btn-ghost" @click="toast('Disimpan ke Rekaman.')"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
      </div>
      <p v-if="store.plan === 'gratis'" class="mt-3 text-sm text-amber-400"><i class="fa-solid fa-circle-info"></i> Hasil ini memiliki watermark. <router-link to="/langganan" class="underline">Upgrade untuk menghapusnya.</router-link></p>
    </template>
  </div>
</template>
