<script setup>
import { ref } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { store, toast } from '../store'
const target = ref(null)
function remove() { store.recordings = store.recordings.filter((i) => i.id !== target.value); target.value = null; toast('Rekaman dihapus.') }
</script>
<template>
  <div class="wrap py-10">
    <h1 class="mb-6 text-3xl font-bold">Hasil Rekaman</h1>
    <ul class="space-y-3">
      <li v-for="i in store.recordings" :key="i.id" class="card flex flex-col gap-3 !p-4 md:flex-row md:items-center">
        <div class="flex-1"><p class="font-semibold">{{ i.name }}</p><p class="text-sm text-slate-400">{{ i.char }} · {{ i.date }}</p></div>
        <audio :src="i.url" controls class="w-full md:w-72"></audio>
        <a :href="i.url" :download="'suaraku-' + i.id + '.wav'" class="p-2 text-slate-300" :aria-label="'Unduh ' + i.name"><i class="fa-solid fa-download"></i></a>
        <button class="p-2 text-red-400" :aria-label="'Hapus ' + i.name" @click="target = i.id"><i class="fa-solid fa-trash"></i></button>
      </li>
    </ul>
    <div v-if="!store.recordings.length" class="card text-center"><i class="fa-solid fa-microphone text-3xl text-slate-500"></i><p class="mt-2">Belum ada rekaman</p><router-link to="/voice-changer" class="btn-primary mt-4">Buat Rekaman Pertama</router-link></div>
    <p class="mt-4 text-sm text-slate-500">Menyimpan maksimal 5 hasil terakhir di browser ini.</p>
    <ConfirmDialog v-if="target" title="Hapus rekaman ini?" text="Tindakan ini tidak bisa dibatalkan." ok-text="Hapus" @ok="remove" @cancel="target = null" />
  </div>
</template>
