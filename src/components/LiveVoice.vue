<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLiveVoice } from '../composables/useLiveVoice'
import { useLiveRvc } from '../composables/useLiveRvc'
import { store, toast } from '../store'
import { presets, names } from '../audio/presets'
import { rvcModelCoverUrl, rvcStatus } from '../Audio/rvc.js'

const browserLive = useLiveVoice()
const rvcLive = useLiveRvc()

const sliders = [['pitch', 'Pitch', 50, 200], ['echo', 'Gema (echo)', 0, 100], ['reverb', 'Ruang (reverb)', 0, 100], ['volume', 'Volume', 0, 150]]
const active = ref('normal')
const rvcTune = ref(0)
const rvcRuntime = ref(null)
const useRvc = computed(() => Boolean(store.rvcModelId))
const live = computed(() => useRvc.value ? rvcLive.live.value : browserLive.live.value)
const stopping = computed(() => useRvc.value && rvcLive.stopping.value)
const error = computed(() => useRvc.value ? rvcLive.error.value : browserLive.error.value)
const level = computed(() => useRvc.value ? rvcLive.level.value : browserLive.level.value)
const latency = computed(() => useRvc.value ? rvcLive.latency.value : browserLive.latency.value)
onMounted(async () => {
  if (useRvc.value) rvcRuntime.value = await rvcStatus()
})

function use(k) {
  active.value = k
  const { pitch, robot, echo, reverb } = presets[k]
  Object.assign(browserLive.p, { pitch, robot, echo, reverb })
}
watch(() => store.selected, (c) => use(c.preset || 'normal'), { immediate: true })

async function toggle() {
  if (stopping.value) return
  if (live.value) {
    if (useRvc.value) rvcLive.stop()
    else browserLive.stop()
    toast('Live dihentikan.')
    return
  }
  if (useRvc.value) {
    if (!store.loggedIn) {
      toast('Masuk terlebih dahulu untuk menggunakan model RVC.')
      return
    }
    if (!store.premium) {
      toast('Upgrade ke Premium untuk menggunakan model RVC.')
      return
    }
    await rvcLive.start(store.rvcModelId, { pitch: rvcTune.value, accessToken: store.accessToken })
  }
  else await browserLive.start()
  if (live.value) toast('Live aktif. Pakai headset!')
}
</script>
<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="card flex flex-col items-center gap-4 text-center">
      <p class="w-full rounded-xl border border-amber-400 bg-amber-400/10 p-3 text-sm text-amber-300"><i class="fa-solid fa-headphones"></i> Pakai headset agar suara tidak berdengung (feedback).</p>
      <button class="flex h-28 w-28 items-center justify-center rounded-full text-4xl text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        :class="live ? 'animate-pulse bg-emerald-500' : 'bg-violet-600 hover:bg-violet-700'" :disabled="stopping" :aria-label="live ? 'Matikan mode live' : 'Nyalakan mode live'" @click="toggle">
        <i class="fa-solid fa-power-off"></i>
      </button>
      <p class="font-semibold" :class="live ? 'text-emerald-400' : 'text-slate-400'">{{ stopping ? 'Memproses potongan terakhir...' : live ? (useRvc ? 'RVC Live aktif' : 'Live aktif') : 'Live mati' }}</p>
      <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>
      <div class="w-full">
        <div class="mb-1 flex justify-between gap-2 text-sm text-slate-400">
          <span>Level suara</span>
          <span v-if="live && useRvc">{{ latency ? `Latensi ${ (latency / 1000).toFixed(1) } dtk` : 'Menunggu hasil konversi pertama...' }}</span>
          <span v-else-if="live">Latensi sekitar {{ latency }} ms</span>
        </div>
        <div class="h-3 w-full overflow-hidden rounded-full bg-slate-700"><div class="h-3 rounded-full bg-linear-to-r from-emerald-400 to-violet-500 transition-[width] duration-75" :style="{ width: level + '%' }"></div></div>
      </div>
      <div v-if="useRvc" class="flex items-center gap-3 text-sm">
        <img v-if="rvcModelCoverUrl(store.rvcModelId)" :src="rvcModelCoverUrl(store.rvcModelId)" :alt="`Logo ${store.rvcModelName}`" class="h-12 w-12 rounded-full object-cover object-top" />
        <p class="text-slate-400">Model RVC: <b class="text-white">{{ store.rvcModelName }}</b></p>
      </div>
      <p v-else class="text-sm text-slate-400">Karakter: <b class="text-white">{{ store.selected.name }}</b></p>
    </section>
    <section class="card space-y-4">
      <template v-if="useRvc">
        <h2 class="font-bold">RVC Live</h2>
        <p class="text-sm text-slate-300">Audio diproses per potongan 6 detik. Hasil pertama memiliki jeda beberapa detik dan dapat tersendat jika server tidak cukup cepat.</p>
        <p v-if="rvcRuntime?.rvc_installed && !rvcRuntime.gpu_available" class="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
          Server tidak mendeteksi GPU; RVC Live berjalan di CPU dan kemungkinan tertinggal dari audio.
        </p>
        <label class="block">
          <span class="mb-1 flex justify-between text-sm"><span>Tune (semiton)</span><span class="font-mono text-violet-300">{{ rvcTune }}</span></span>
          <input v-model.number="rvcTune" type="range" min="-12" max="12" class="w-full accent-violet-500" :disabled="live || stopping" />
        </label>
        <router-link to="/karakter" class="btn-ghost w-full">Ganti model RVC</router-link>
      </template>
      <template v-else>
        <h2 class="font-bold">Efek Live</h2>
        <div class="flex flex-wrap gap-2">
          <button v-for="(v, k) in presets" :key="k" class="rounded-full border px-4 py-1.5 text-sm" :class="active === k ? 'border-violet-600 bg-violet-600' : 'border-slate-600'" @click="use(k)">{{ names[k] }}</button>
        </div>
        <label v-for="s in sliders" :key="s[0]" class="block">
          <span class="mb-1 flex justify-between text-sm"><span>{{ s[1] }}</span><span class="font-mono text-violet-300">{{ browserLive.p[s[0]] }}{{ s[0] === 'pitch' ? '%' : '' }}</span></span>
          <input v-model.number="browserLive.p[s[0]]" type="range" :min="s[2]" :max="s[3]" class="w-full accent-violet-500" />
        </label>
        <label class="flex items-center gap-2 text-sm"><input v-model="browserLive.p.robot" type="checkbox" class="accent-violet-500" /> Efek robot</label>
      </template>
    </section>
  </div>
</template>
