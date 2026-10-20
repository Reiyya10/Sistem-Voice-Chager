<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import VoiceRecorder from '../components/VoiceRecorder.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import EffectSlider from '../components/EffectSlider.vue'
import CharacterModal from '../components/CharacterModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { store, toast } from '../store'
const router = useRouter()
const modal = ref(false), noCredit = ref(false), hasAudio = ref(false), busy = ref(false), done = ref(false), error = ref('')
const defaults = { pitch: 50, speed: 50, volume: 70, reverb: 10, noise: 30 }
const fx = reactive({ ...defaults })
const labels = [['pitch', 'Pitch'], ['speed', 'Kecepatan'], ['volume', 'Volume'], ['reverb', 'Gema'], ['noise', 'Pengurangan Noise']]
function onFile(e) {
  const f = e.target.files[0]
  if (!f) return
  if (!/\.(mp3|wav|m4a)$/i.test(f.name)) { error.value = 'Format tidak didukung. Gunakan MP3, WAV, atau M4A.'; return }
  error.value = ''; hasAudio.value = true; done.value = false; toast('Audio diunggah.')
}
function convert() {
  if (!hasAudio.value) { error.value = 'Rekam atau unggah audio dulu.'; return }
  if (store.credits <= 0) { noCredit.value = true; return }
  error.value = ''; busy.value = true; done.value = false
  setTimeout(() => { busy.value = false; done.value = true; store.credits = Math.max(0, store.credits - 2); toast('Done! Suara barumu sudah siap.') }, 1500)
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="mb-6 text-3xl font-bold">Voice Changer</h1>
    <p v-if="store.credits <= 2 && store.credits > 0" class="mb-4 rounded-xl border border-amber-400 bg-amber-400/10 p-3 text-amber-300">Kredit kamu hampir habis (tersisa {{ store.credits }}). <router-link to="/langganan" class="underline">Upgrade</router-link></p>
    <div class="grid gap-6 lg:grid-cols-3">
      <section class="card space-y-4">
        <h2 class="font-bold">Karakter Terpilih</h2>
        <div class="flex items-center gap-4"><span class="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br ring-2 ring-violet-600" :class="store.selected.bg"><i class="fa-solid fa-wave-square"></i></span><p class="font-semibold">{{ store.selected.name }}</p></div>
        <button class="btn-ghost w-full" @click="modal = true">Ganti Karakter</button>
        <p class="text-sm text-slate-400">Sisa kredit: <b class="text-white">{{ store.credits }}</b></p>
      </section>
      <section class="space-y-6">
        <VoiceRecorder @done="hasAudio = true; done = false" />
        <label class="btn-ghost w-full cursor-pointer"><i class="fa-solid fa-upload"></i> Unggah Audio<input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.amr,.3gp" class="sr-only" @change="onFile" /></label>
        <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>
        <AudioPlayer :ready="done" :busy="busy" />
      </section>
      <section class="card space-y-4">
        <h2 class="font-bold">Pengaturan Suara</h2>
        <EffectSlider v-for="l in labels" :key="l[0]" v-model="fx[l[0]]" :label="l[1]" />
        <button class="text-sm text-violet-400" @click="Object.assign(fx, defaults)">Reset</button>
      </section>
    </div>
    <div class="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 backdrop-blur">
      <span class="hidden text-sm text-slate-400 sm:block">Menggunakan 2 kredit</span>
      <button class="btn-primary w-full sm:w-auto" :disabled="busy" @click="convert">Ubah Suara</button>
    </div>
    <CharacterModal v-if="modal" @close="modal = false" />
    <ConfirmDialog v-if="noCredit" title="Kredit habis" text="Upgrade ke Pro untuk melanjutkan." ok-text="Upgrade ke Pro" @ok="router.push('/langganan')" @cancel="noCredit = false" />
  </div>
</template>
