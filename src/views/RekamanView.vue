<script setup>
import { ref } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { toast } from '../store'
const items = ref([
  { id: 1, name: 'Robot Voice 01', char: 'Robot Pelayan', dur: '00:24', date: '13 Okt 2026' },
  { id: 2, name: 'Narasi Podcast', char: 'Narator Dalam', dur: '01:12', date: '12 Okt 2026' },
  { id: 3, name: 'Skit TikTok', char: 'Anak Ceria', dur: '00:18', date: '10 Okt 2026' },
])
const target = ref(null)
function remove() { items.value = items.value.filter((i) => i.id !== target.value); target.value = null; toast('Rekaman dihapus.') }
</script>
<template>
  <div class="wrap py-10">
    <h1 class="mb-6 text-3xl font-bold">Hasil Rekaman</h1>
    <ul class="space-y-3">
      <li v-for="i in items" :key="i.id" class="card flex flex-col gap-3 !p-4 sm:flex-row sm:items-center">
        <button class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600" :aria-label="'Putar ' + i.name"><i class="fa-solid fa-play"></i></button>
        <div class="flex-1"><p class="font-semibold">{{ i.name }}</p><p class="text-sm text-slate-400">{{ i.char }} · {{ i.dur }} · {{ i.date }}</p></div>
        <button class="p-2 text-slate-300" :aria-label="'Unduh ' + i.name" @click="toast('Mengunduh...')"><i class="fa-solid fa-download"></i></button>
        <button class="p-2 text-red-400" :aria-label="'Hapus ' + i.name" @click="target = i.id"><i class="fa-solid fa-trash"></i></button>
      </li>
    </ul>
    <div v-if="!items.length" class="card text-center"><i class="fa-solid fa-microphone text-3xl text-slate-500"></i><p class="mt-2">Belum ada rekaman</p><router-link to="/voice-changer" class="btn-primary mt-4">Buat Rekaman Pertama</router-link></div>
    <ConfirmDialog v-if="target" title="Hapus rekaman ini?" text="Tindakan ini tidak bisa dibatalkan." ok-text="Hapus" @ok="remove" @cancel="target = null" />
  </div>
</template>
