<script setup>
import { ref, reactive } from 'vue'
import { toast } from '../store'
const faq = [['Apakah gratis?', 'Paket Gratis memberi 10 menit per bulan.'], ['Format apa yang didukung?', 'MP3, WAV, dan M4A.'], ['Bisa dipakai komersial?', 'Lisensi komersial ada di paket Studio.']]
const open = ref(-1)
const f = reactive({ nama: '', email: '', pesan: '' })
const err = reactive({})
const sending = ref(false)
function send() {
  err.nama = f.nama ? '' : 'Nama wajib diisi'
  err.email = /^\S+@\S+\.\S+$/.test(f.email) ? '' : 'Email tidak valid'
  err.pesan = f.pesan ? '' : 'Pesan wajib diisi'
  if (err.nama || err.email || err.pesan) return
  sending.value = true
  setTimeout(() => { sending.value = false; f.nama = f.email = f.pesan = ''; toast('Pesan terkirim. Terima kasih!') }, 1000)
}
</script>
<template>
  <div class="wrap grid gap-10 py-10 lg:grid-cols-2">
    <section>
      <h1 class="text-3xl font-bold">Tentang SuaraKu</h1>
      <p class="mt-3 text-slate-400">SuaraKu membantu kreator, gamer, dan podcaster mengubah suara dengan karakter orisinal. Kami mewajibkan izin untuk kloning suara dan menjaga data tetap privat.</p>
      <h2 class="mb-3 mt-8 text-xl font-bold">FAQ</h2>
      <div v-for="(q, i) in faq" :key="q[0]" class="mb-2 rounded-xl border border-slate-700">
        <button class="flex w-full justify-between p-4 text-left font-semibold" :aria-expanded="open === i" @click="open = open === i ? -1 : i">{{ q[0] }}<i class="fa-solid" :class="open === i ? 'fa-minus' : 'fa-plus'"></i></button>
        <p v-if="open === i" class="px-4 pb-4 text-slate-400">{{ q[1] }}</p>
      </div>
    </section>
    <section class="card">
      <h2 class="mb-4 text-xl font-bold">Hubungi Kami</h2>
      <form class="space-y-4" novalidate @submit.prevent="send">
        <div><label for="nama" class="mb-1 block text-sm">Nama</label><input id="nama" v-model="f.nama" class="input" /><p class="text-sm text-red-400">{{ err.nama }}</p></div>
        <div><label for="email" class="mb-1 block text-sm">Email</label><input id="email" v-model="f.email" type="email" class="input" /><p class="text-sm text-red-400">{{ err.email }}</p></div>
        <div><label for="pesan" class="mb-1 block text-sm">Pesan</label><textarea id="pesan" v-model="f.pesan" rows="4" class="input"></textarea><p class="text-sm text-red-400">{{ err.pesan }}</p></div>
        <button class="btn-primary w-full" :disabled="sending">{{ sending ? 'Mengirim...' : 'Kirim Pesan' }}</button>
      </form>
    </section>
  </div>
</template>
