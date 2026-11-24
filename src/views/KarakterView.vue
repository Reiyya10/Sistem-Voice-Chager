<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CharacterCard from '../components/CharacterCard.vue'
import { characters, store, toast } from '../store'
import { rvcModels as fetchRvcModels, rvcModelCoverUrl } from '../Audio/rvc.js'
const router = useRouter()
const q = ref(''), filter = ref('Semua'), sel = ref(characters[0])
const tab = ref('karakter'), rvcModels = ref([]), selectedRvcModel = ref(null), rvcLoading = ref(false), rvcError = ref('')
const chips = ['Semua', 'Robot', 'Fantasi']
const list = computed(() => characters.filter((c) => c.name.toLowerCase().includes(q.value.toLowerCase()) &&
  (filter.value === 'Semua' || c.tags.includes(filter.value))))
const rvcList = computed(() => rvcModels.value.filter((model) =>
  `${model.name} ${model.owner}`.toLowerCase().includes(q.value.toLowerCase())))
onMounted(async () => {
  rvcLoading.value = true
  try {
    rvcModels.value = (await fetchRvcModels()).filter((model) => model.id !== 'demo')
    selectedRvcModel.value = rvcModels.value.find((model) => model.id === store.rvcModelId) || null
  } catch (e) {
    rvcError.value = e.message || 'Gagal memuat model RVC.'
  } finally {
    rvcLoading.value = false
  }
})

function use() {
  store.rvcModelId = ''
  store.rvcModelName = ''
  store.rvcModelOwner = ''
  store.selected = sel.value; toast('Karakter dipilih.'); router.push('/voice-changer')
}

function useRvcModel() {
  if (!selectedRvcModel.value) return
  if (!store.loggedIn) {
    toast('Masuk dulu untuk menggunakan model RVC.')
    return router.push('/masuk')
  }
  if (!store.premium) {
    toast('Model RVC hanya tersedia untuk pengguna Premium.')
    return router.push('/langganan')
  }
  const model = selectedRvcModel.value
  store.rvcModelId = model.id
  store.rvcModelName = model.name
  store.rvcModelOwner = model.owner
  toast('Model RVC dipilih.')
  router.push('/voice-changer')
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="text-3xl font-bold">Daftar Karakter</h1>
    <div class="mt-6 flex w-fit gap-2 rounded-full bg-slate-800 p-1" role="tablist" aria-label="Jenis suara">
      <button class="rounded-full px-4 py-2 text-sm" :class="tab === 'karakter' && 'bg-violet-600'" role="tab" :aria-selected="tab === 'karakter'" @click="tab = 'karakter'">Karakter Suara</button>
      <button class="rounded-full px-4 py-2 text-sm" :class="tab === 'rvc' && 'bg-violet-600'" role="tab" :aria-selected="tab === 'rvc'" @click="tab = 'rvc'">Model AI (RVC)</button>
    </div>
    <div class="relative mt-4"><input v-model="q" class="input" :placeholder="tab === 'rvc' ? 'Cari model RVC...' : 'Cari karakter suara...'" :aria-label="tab === 'rvc' ? 'Cari model RVC' : 'Cari karakter'" /><button v-if="q" class="absolute right-3 top-3" aria-label="Hapus pencarian" @click="q = ''"><i class="fa-solid fa-xmark"></i></button></div>
    <div v-if="tab === 'karakter'" class="mt-4 flex flex-wrap gap-2">
      <button v-for="c in chips" :key="c" class="rounded-full border px-4 py-1.5 text-sm" :class="filter === c ? 'border-violet-600 bg-violet-600' : 'border-slate-600'" @click="filter = c">{{ c }}</button>
    </div>
    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div v-if="tab === 'karakter'">
        <div class="grid grid-cols-2 gap-6 xl:grid-cols-3"><CharacterCard v-for="c in list" :key="c.id" :char="c" :selected="sel.id === c.id" @select="sel = $event" /></div>
        <div v-if="!list.length" class="card mt-6 text-center"><p>Karakter tidak ditemukan.</p></div>
      </div>
      <div v-else>
        <p v-if="rvcLoading" class="card text-center text-slate-300">Memuat model RVC...</p>
        <p v-else-if="rvcError" class="card text-center text-amber-300" role="alert">{{ rvcError }}</p>
        <div v-else-if="rvcList.length" class="grid grid-cols-2 gap-6 xl:grid-cols-3">
          <button v-for="model in rvcList" :key="model.id" type="button"
            class="group flex flex-col items-center gap-2 rounded-2xl border bg-slate-800 p-4 text-center transition hover:shadow-lg hover:shadow-violet-600/20 focus-visible:outline-2 focus-visible:outline-violet-400"
            :class="selectedRvcModel?.id === model.id ? 'border-violet-500' : 'border-slate-700'"
            :aria-pressed="selectedRvcModel?.id === model.id" @click="selectedRvcModel = model">
            <span class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-linear-to-br ring-[3px] ring-violet-600" :class="!rvcModelCoverUrl(model.id) && 'from-violet-500 to-purple-800'">
              <img v-if="rvcModelCoverUrl(model.id)" :src="rvcModelCoverUrl(model.id)" :alt="`Logo ${model.name}`" class="h-full w-full object-cover object-top" loading="lazy" />
              <i v-else class="fa-solid fa-wave-square text-3xl text-white" aria-hidden="true"></i>
            </span>
            <span class="font-semibold">{{ model.name }}</span>
            <span class="text-xs text-slate-400">Model AI (RVC)</span>
            <span class="text-xs text-slate-300">Izin: {{ model.owner }}</span>
          </button>
        </div>
        <div v-else class="card text-center">
          <i class="fa-solid fa-wave-square text-3xl text-violet-400" aria-hidden="true"></i>
          <p class="mt-3 font-semibold">Model RVC belum tersedia</p>
          <p class="mt-1 text-sm text-slate-400">Pastikan server RVC aktif dan model sudah terverifikasi.</p>
        </div>
      </div>
      <aside v-if="tab === 'karakter'" class="card h-fit space-y-3 text-center lg:sticky lg:top-24">
        <span class="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br ring-4 ring-violet-600" :class="sel.bg"><i class="fa-solid fa-wave-square text-4xl"></i></span>
        <h2 class="text-xl font-bold">{{ sel.name }}</h2>
        <p class="text-amber-400"><i class="fa-solid fa-star"></i> {{ sel.rating }} ({{ sel.votes }})</p>
        <button class="btn-green w-full text-lg" @click="use">GUNAKAN</button>
      </aside>
      <aside v-else class="card h-fit space-y-3 text-center lg:sticky lg:top-24">
        <span class="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-violet-500 to-purple-800 ring-4 ring-violet-600">
          <img v-if="selectedRvcModel && rvcModelCoverUrl(selectedRvcModel.id)" :src="rvcModelCoverUrl(selectedRvcModel.id)" :alt="`Logo ${selectedRvcModel.name}`" class="h-full w-full object-cover object-top" />
          <i v-else class="fa-solid fa-wave-square text-4xl" aria-hidden="true"></i>
        </span>
        <h2 class="text-xl font-bold">{{ selectedRvcModel?.name || 'Pilih Model RVC' }}</h2>
        <p v-if="selectedRvcModel" class="text-sm text-slate-400">Izin: {{ selectedRvcModel.owner }}</p>
        <p v-else class="text-sm text-slate-400">Pilih model untuk menggunakannya di Voice Changer.</p>
        <button class="btn-green w-full text-lg" :disabled="!selectedRvcModel" @click="useRvcModel">GUNAKAN</button>
      </aside>
    </div>
  </div>
</template>
