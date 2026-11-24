<script setup>
import { ref, computed } from 'vue'
import { store } from '../store'
const props = defineProps({ src: String, orig: String, busy: Boolean, name: { type: String, default: 'hasil-suaraku' } })
const showOrig = ref(false)
const current = computed(() => (showOrig.value ? props.orig : props.src || props.orig))
</script>
<template>
  <div class="card">
    <h3 class="mb-3 font-bold">Hasil Suara</h3>
    <p v-if="busy" class="animate-pulse text-violet-300">Mengubah suara...</p>
    <template v-else-if="orig">
      <div v-if="src && orig" class="mb-3 flex w-fit gap-1 rounded-full bg-slate-900 p-1 text-sm">
        <button class="rounded-full px-4 py-1" :class="!showOrig && 'bg-violet-600'" @click="showOrig = false">Hasil</button>
        <button class="rounded-full px-4 py-1" :class="showOrig && 'bg-violet-600'" @click="showOrig = true">Asli</button>
      </div>
      <audio :key="current" :src="current" controls class="w-full"></audio>
      <a v-if="src" :href="src" :download="name + '.wav'" class="btn-ghost mt-4"><i class="fa-solid fa-download"></i> Unduh WAV</a>
      <p v-else class="mt-3 text-sm text-slate-400">Tekan Ubah Suara untuk membuat hasil dari audio asli.</p>
    </template>
    <p v-else class="text-slate-400">Belum ada hasil. Rekam atau unggah audio, lalu tekan Ubah Suara.</p>
  </div>
</template>
