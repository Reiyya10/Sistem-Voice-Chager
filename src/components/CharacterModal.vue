<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCard from './CharacterCard.vue'
import { characters, store, toast, isLocked } from '../store'
const emit = defineEmits(['close'])
const router = useRouter()
const q = ref('')
const sel = ref(store.selected)
const list = computed(() => characters.filter((c) => c.name.toLowerCase().includes(q.value.toLowerCase())))
function use() {
  if (isLocked(sel.value)) { emit('close'); router.push('/langganan'); return }
  store.selected = sel.value
  toast('Karakter dipilih.')
  emit('close')
}
</script>
<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-6" @click.self="emit('close')">
    <div role="dialog" aria-modal="true" aria-label="Pilih Karakter Suara" class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-slate-900 md:rounded-2xl">
      <div class="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 class="text-xl font-bold">Pilih Karakter Suara</h2>
        <button class="p-2" aria-label="Tutup" @click="emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="p-4"><input v-model="q" class="input" placeholder="Cari suara" aria-label="Cari suara" /></div>
      <div class="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-4 pt-0 md:grid-cols-4">
        <CharacterCard v-for="c in list" :key="c.id" :char="c" :selected="sel.id === c.id" @select="sel = $event" />
        <p v-if="!list.length" class="col-span-full py-10 text-center text-slate-400">Karakter tidak ditemukan.</p>
      </div>
      <div class="border-t border-slate-700 p-4">
        <button class="btn-green w-full text-lg" @click="use">{{ isLocked(sel) ? 'Upgrade untuk Menggunakan' : 'GUNAKAN' }}</button>
      </div>
    </div>
  </div>
</template>
