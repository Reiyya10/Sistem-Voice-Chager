<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { store, toast } from '../store'
const router = useRouter()
const tab = ref('masuk'), show = ref(false)
const f = reactive({ nama: '', email: '', pass: '' })
const err = reactive({})
function submit() {
  err.nama = tab.value === 'daftar' && !f.nama ? 'Nama wajib diisi' : ''
  err.email = !f.email ? 'Email wajib diisi' : /^\S+@\S+\.\S+$/.test(f.email) ? '' : 'Format email tidak valid'
  err.pass = f.pass.length < 8 ? 'Minimal 8 karakter' : ''
  if (err.nama || err.email || err.pass) return
  store.loggedIn = true
  toast(tab.value === 'masuk' ? 'Berhasil masuk.' : 'Akun berhasil dibuat.')
  router.push('/voice-changer')
}
</script>
<template>
  <div class="wrap grid items-center gap-10 py-10 lg:grid-cols-2">
    <div class="hidden rounded-2xl bg-linear-to-br from-violet-700 via-fuchsia-600 to-cyan-500 p-10 lg:block">
      <i class="fa-solid fa-microphone text-6xl"></i><h1 class="mt-6 text-3xl font-bold">Selamat Datang di SuaraKu</h1><p class="mt-2 text-white/80">Ubah suaramu jadi karakter favorit.</p>
    </div>
    <div class="card mx-auto w-full max-w-md">
      <div class="mb-6 grid grid-cols-2 gap-2" role="tablist">
        <button v-for="t in ['masuk', 'daftar']" :key="t" class="rounded-xl py-2 font-semibold capitalize" :class="tab === t ? 'bg-violet-600' : 'bg-slate-900'" @click="tab = t">{{ t }}</button>
      </div>
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <div v-if="tab === 'daftar'"><label for="n" class="mb-1 block text-sm">Nama</label><input id="n" v-model="f.nama" class="input" /><p class="text-sm text-red-400">{{ err.nama }}</p></div>
        <div><label for="e" class="mb-1 block text-sm">Email</label><input id="e" v-model="f.email" type="email" class="input" /><p class="text-sm text-red-400">{{ err.email }}</p></div>
        <div><label for="p" class="mb-1 block text-sm">Password</label>
          <div class="relative"><input id="p" v-model="f.pass" :type="show ? 'text' : 'password'" class="input" /><button type="button" class="absolute right-3 top-3.5" aria-label="Tampilkan password" @click="show = !show"><i class="fa-solid" :class="show ? 'fa-eye-slash' : 'fa-eye'"></i></button></div>
          <p class="text-sm text-red-400">{{ err.pass }}</p></div>
        <button class="btn-primary w-full">{{ tab === 'masuk' ? 'Masuk' : 'Daftar' }}</button>
      </form>
    </div>
  </div>
</template>
