<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCard from '../components/CharacterCard.vue'
import { characters, store, toast, isLocked } from '../store'
const router = useRouter()
const q = ref(''), filter = ref('Semua'), sel = ref(characters[0])
const chips = ['Semua', 'Gratis', 'Premium', 'Robot', 'Fantasi']
const list = computed(() => characters.filter((c) => c.name.toLowerCase().includes(q.value.toLowerCase()) &&
  (filter.value === 'Semua' || (filter.value === 'Gratis' && !c.premium) || (filter.value === 'Premium' && c.premium) || c.tags.includes(filter.value))))
function use() {
  if (isLocked(sel.value)) return router.push('/langganan')
  store.selected = sel.value; toast('Karakter dipilih.'); router.push('/voice-changer')
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="text-3xl font-bold">Daftar Karakter</h1>
    <div class="relative mt-6"><input v-model="q" class="input" placeholder="Cari karakter suara..." aria-label="Cari karakter" /><button v-if="q" class="absolute right-3 top-3" aria-label="Hapus pencarian" @click="q = ''"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="mt-4 flex flex-wrap gap-2">
      <button v-for="c in chips" :key="c" class="rounded-full border px-4 py-1.5 text-sm" :class="filter === c ? 'border-violet-600 bg-violet-600' : 'border-slate-600'" @click="filter = c">{{ c }}</button>
    </div>
    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div class="grid grid-cols-2 gap-6 xl:grid-cols-3"><CharacterCard v-for="c in list" :key="c.id" :char="c" :selected="sel.id === c.id" @select="sel = $event" /></div>
        <div v-if="!list.length" class="card mt-6 text-center"><p>Karakter tidak ditemukan.</p></div>
      </div>
      <aside class="card h-fit space-y-3 text-center lg:sticky lg:top-24">
        <span class="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br ring-4 ring-violet-600" :class="sel.bg"><i class="fa-solid fa-wave-square text-4xl"></i></span>
        <h2 class="text-xl font-bold">{{ sel.name }}</h2>
        <p class="text-amber-400"><i class="fa-solid fa-star"></i> {{ sel.rating }} ({{ sel.votes }})</p>
        <button class="btn-green w-full text-lg" @click="use">{{ isLocked(sel) ? 'Upgrade untuk Menggunakan' : 'GUNAKAN' }}</button>
      </aside>
    </div>
  </div>
</template>
