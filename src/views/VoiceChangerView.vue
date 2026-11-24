<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VoiceRecorder from '../components/VoiceRecorder.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import EffectSlider from '../components/EffectSlider.vue'
import LiveVoice from '../components/LiveVoice.vue'
import { presets } from '../audio/presets.js'
import { processAudio } from '../audio/processor.js'
import { store, toast, addRecording } from '../store.js'
import { rvcStatus, rvcConvert, rvcModelCoverUrl } from '../Audio/rvc.js'
const router = useRouter()
const mode = ref('rekam')
const useRvc = computed(() => Boolean(store.rvcModelId))
const rvcOnline = ref(false), rvcGpu = ref({ available: false, name: '' })
const busy = ref(false), error = ref('')
const source = ref(null), srcName = ref(''), origUrl = ref(''), resultUrl = ref('')
const defaults = { pitch: 50, volume: 70, echo: 0, reverb: 0 }
const fx = reactive({ ...defaults })
const rvcDefaults = { tune: 0, inputGain: 0, outputGain: 0, chunkSeconds: 30, indexInfluence: 85, rmsMix: 25, consonantProtection: 35, device: 'auto', silentThreshold: 1, silenceFront: true, rvcQuality: 1, f0Detector: 'rmvpe+' }
const rvcFx = reactive({ ...rvcDefaults })
const labels = [['pitch', 'Pitch'], ['volume', 'Volume'], ['echo', 'Gema (echo)'], ['reverb', 'Ruang (reverb)']]
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function setSource(blob, name) {
  source.value = blob; srcName.value = name; resultUrl.value = ''; error.value = ''
  origUrl.value = URL.createObjectURL(blob)
}
function onRecorded(blob, sec) { setSource(blob, 'Rekaman ' + sec + ' detik'); toast('Rekaman siap diubah.') }
function onFile(e) {
  const f = e.target.files[0]
  if (!f) return
  if (!f.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|opus|amr|3gp)$/i.test(f.name)) { error.value = 'Format tidak didukung. Gunakan file audio seperti MP3, WAV, M4A, atau AAC.'; return }
  setSource(f, f.name); toast('Audio diunggah.')
}
onMounted(async () => {
  if (!useRvc.value) return
  const status = await rvcStatus()
  rvcOnline.value = status?.status === 'ok'
  rvcGpu.value = { available: Boolean(status?.gpu_available), name: status?.gpu_name || '' }
})
async function convert() {
  if (!source.value) { error.value = 'Rekam atau unggah audio dulu.'; return }
  if (useRvc.value && (!store.loggedIn || !store.premium)) {
    error.value = 'Model RVC hanya tersedia untuk pengguna Premium.'
    toast('Aktifkan Premium untuk menggunakan model RVC.')
    router.push(store.loggedIn ? '/langganan' : '/masuk')
    return
  }
  error.value = ''; busy.value = true; resultUrl.value = ''
  const base = presets[store.selected.preset] || presets.normal
  const p = {
    pitch: clamp(base.pitch * (0.5 + fx.pitch / 100), 50, 200), robot: base.robot,
    echo: clamp(base.echo + fx.echo, 0, 100), reverb: clamp(base.reverb + fx.reverb, 0, 100), volume: (fx.volume / 70) * 100,
  }
  try {
    let out
    if (useRvc.value) {
      if (!rvcOnline.value) throw new Error('Server RVC belum aktif. Jalankan Server\\run.bat lalu coba lagi.')
      out = await rvcConvert(source.value, store.rvcModelId, {
        pitch: rvcFx.tune,
        inputGainDb: rvcFx.inputGain,
        outputGainDb: rvcFx.outputGain,
        chunkSeconds: rvcFx.chunkSeconds,
        indexInfluence: rvcFx.indexInfluence / 100,
        rmsMixRate: rvcFx.rmsMix / 100,
        consonantProtection: rvcFx.consonantProtection / 100,
        device: rvcFx.device,
        accessToken: store.accessToken,
        silentThreshold: rvcFx.silentThreshold / 100000,
        silenceFront: rvcFx.silenceFront ? 1 : 0,
        rvcQuality: rvcFx.rvcQuality,
      })
    } else out = await processAudio(source.value, p)
    resultUrl.value = URL.createObjectURL(out)
    await addRecording({ id: Date.now(), name: srcName.value, char: useRvc.value ? store.rvcModelName : store.selected.name, date: new Date().toLocaleDateString('id-ID'), blob: out })
    toast('Done! Suara barumu sudah siap.')
  } catch (e) { error.value = e.message || 'Gagal memproses audio. Coba file atau rekaman lain.' }
  busy.value = false
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="mb-6 text-3xl font-bold">Voice Changer</h1>
    <div class="mb-6 flex w-fit gap-2 rounded-full bg-slate-800 p-1" role="tablist">
      <button class="rounded-full px-5 py-2" :class="mode === 'rekam' && 'bg-violet-600'" @click="mode = 'rekam'"><i class="fa-solid fa-file-audio mr-1"></i> Rekaman</button>
      <button class="rounded-full px-5 py-2" :class="mode === 'live' && 'bg-violet-600'" @click="mode = 'live'"><i class="fa-solid fa-tower-broadcast mr-1"></i> Live</button>
    </div>
    <template v-if="mode === 'rekam'">
      <div v-if="useRvc" class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
        <img v-if="rvcModelCoverUrl(store.rvcModelId)" :src="rvcModelCoverUrl(store.rvcModelId)" :alt="`Logo ${store.rvcModelName}`" class="h-10 w-10 rounded-full object-cover object-top" />
        <i v-else class="fa-solid fa-wave-square text-violet-300" aria-hidden="true"></i>
        <p class="text-sm"><span class="font-semibold">{{ store.rvcModelName }}</span><span class="ml-2 text-slate-400">Model AI (RVC) · dipilih dari Karakter</span></p>
        <span class="ml-auto text-xs" :class="rvcOnline ? 'text-emerald-300' : 'text-amber-300'">{{ rvcOnline ? 'Server aktif' : 'Server belum aktif' }}</span>
      </div>
      <div class="grid gap-6 lg:grid-cols-3">
        <section class="card space-y-4">
          <h2 class="font-bold">Karakter Terpilih</h2>
          <div class="flex items-center gap-4">
            <span class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br ring-2 ring-violet-600" :class="!useRvc && store.selected.bg">
              <img v-if="useRvc && rvcModelCoverUrl(store.rvcModelId)" :src="rvcModelCoverUrl(store.rvcModelId)" :alt="`Logo ${store.rvcModelName}`" class="h-full w-full object-cover object-top" />
              <i v-else class="fa-solid fa-wave-square"></i>
            </span>
            <p class="font-semibold">{{ useRvc ? store.rvcModelName : store.selected.name }}</p>
          </div>
          <button class="btn-ghost w-full" @click="router.push('/karakter')">{{ useRvc ? 'Ganti Model RVC di Karakter' : 'Pilih Karakter di Halaman Karakter' }}</button>
        </section>
        <section class="space-y-6">
          <VoiceRecorder @done="onRecorded" />
          <label class="btn-ghost w-full cursor-pointer"><i class="fa-solid fa-upload"></i> Unggah Audio<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.amr,.3gp" class="sr-only" @change="onFile" /></label>
          <p v-if="source" class="text-sm text-emerald-400"><i class="fa-solid fa-check"></i> Sumber audio: {{ srcName }}</p>
          <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>
          <AudioPlayer :src="resultUrl" :orig="origUrl" :busy="busy" />
        </section>
        <section class="card space-y-4">
          <h2 class="font-bold">Pengaturan Suara</h2>
          <template v-if="useRvc">
            <EffectSlider v-model="rvcFx.inputGain" label="Gain input" :min-value="-24" :max-value="12" unit=" dB" />
            <EffectSlider v-model="rvcFx.outputGain" label="Gain output" :min-value="-24" :max-value="12" unit=" dB" />
            <EffectSlider v-model="rvcFx.tune" label="TUNE" :min-value="-50" :max-value="50" />
            <EffectSlider v-model="rvcFx.chunkSeconds" label="Ukuran chunk (perkiraan)" :min-value="10" :max-value="40" unit=" dtk" />
            <details class="rounded-xl border border-slate-700 p-3">
              <summary class="cursor-pointer font-semibold">Extra RVC</summary>
              <div class="mt-4 space-y-5">
                <EffectSlider v-model="rvcFx.indexInfluence" label="INDEX RATE" unit="%" />
                <p class="-mt-4 text-xs text-slate-400">Pengaruh index terhadap karakter timbre; 0% menonaktifkan index.</p>
                <EffectSlider v-model="rvcFx.rmsMix" label="RMS mix" unit="%" />
                <p class="-mt-4 text-xs text-slate-400">0% memakai level hasil RVC, 100% mengikuti level volume input.</p>
                <EffectSlider v-model="rvcFx.consonantProtection" label="PROTECT" :max-value="50" unit="%" />
                <label class="block text-sm">
                  <span class="mb-1 block">F0 DETECTOR</span>
                  <select v-model="rvcFx.f0Detector" class="input" disabled>
                    <option value="rmvpe+">RMVPE+</option>
                  </select>
                </label>
                <EffectSlider v-model="rvcFx.silentThreshold" label="S. THRESHOLD" :min-value="0" :max-value="100" :step="1" unit="" />
                <label class="flex items-center justify-between text-sm">
                  <span>SILENCE FRONT</span>
                  <select v-model="rvcFx.silenceFront" class="input w-28">
                    <option :value="true">ON</option>
                    <option :value="false">OFF</option>
                  </select>
                </label>
                <label class="flex items-center justify-between text-sm">
                  <span>RVC QUALITY</span>
                  <select v-model="rvcFx.rvcQuality" class="input w-28">
                    <option :value="0">LOW</option>
                    <option :value="1">HIGH</option>
                  </select>
                </label>
              </div>
            </details>
            <label class="block text-sm">
              <span class="mb-1 block">Perangkat inferensi</span>
              <select v-model="rvcFx.device" class="input">
                <option value="auto">Otomatis (GPU jika tersedia)</option>
                <option value="cpu">CPU</option>
                <option value="gpu" :disabled="!rvcGpu.available">GPU CUDA{{ rvcGpu.name ? ` — ${rvcGpu.name}` : '' }}{{ rvcGpu.available ? '' : ' (tidak tersedia)' }}</option>
              </select>
              <span class="mt-1 block text-xs text-slate-400">
                {{ rvcGpu.available ? `GPU tersedia: ${rvcGpu.name}` : 'Server ini terdeteksi CPU-only; pilih Otomatis atau CPU.' }}
              </span>
            </label>
          </template>
          <template v-else>
            <EffectSlider v-for="l in labels" :key="l[0]" v-model="fx[l[0]]" :label="l[1]" />
          </template>
          <button class="text-sm text-violet-400" @click="Object.assign(fx, defaults); Object.assign(rvcFx, rvcDefaults)">Reset</button>
        </section>
      </div>
      <div class="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 backdrop-blur">
        <span class="hidden text-sm text-slate-400 sm:block">{{ useRvc ? (store.premium ? 'Akses model Premium aktif' : 'Model RVC memerlukan Premium') : 'Pemrosesan efek browser gratis' }}</span>
        <button class="btn-primary w-full sm:w-auto" :disabled="busy" @click="convert">{{ busy ? 'Memproses...' : 'Ubah Suara' }}</button>
      </div>
    </template>
    <LiveVoice v-else />
  </div>
</template>
