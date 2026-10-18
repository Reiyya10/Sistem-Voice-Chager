<script setup>
import { ref } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { store, toast } from '../store'
const cancel = ref(false)
const history = [['INV-0003', '13 Okt 2026', 'Pro', 'Lunas'], ['INV-0002', '13 Sep 2026', 'Pro', 'Lunas']]
function doCancel() { store.plan = 'gratis'; store.credits = 10; cancel.value = false; toast('Langganan dibatalkan.') }
</script>
<template>
  <div class="wrap space-y-6 py-10">
    <h1 class="text-3xl font-bold">Akun Saya</h1>
    <section class="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p class="text-sm text-slate-400">Paket saat ini</p><p class="text-2xl font-bold capitalize"><i v-if="store.plan !== 'gratis'" class="fa-solid fa-crown mr-2 text-amber-400"></i>{{ store.plan }}</p><p class="text-slate-400">Sisa kredit: {{ store.credits }} menit</p></div>
      <div class="flex gap-3"><router-link to="/langganan" class="btn-ghost">Ubah Paket</router-link><button v-if="store.plan !== 'gratis'" class="btn-ghost text-red-400" @click="cancel = true">Batalkan Langganan</button></div>
    </section>
    <section class="card"><h2 class="mb-3 font-bold">Riwayat Pembayaran</h2>
      <ul class="space-y-2"><li v-for="h in history" :key="h[0]" class="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-900 p-3 text-sm"><span>{{ h[0] }}</span><span>{{ h[1] }}</span><span>{{ h[2] }}</span><span class="text-emerald-400">{{ h[3] }}</span></li></ul>
    </section>
    <ConfirmDialog v-if="cancel" title="Batalkan langganan?" text="Kamu akan kembali ke paket Gratis." ok-text="Lanjut Batalkan" @ok="doCancel" @cancel="cancel = false" />
  </div>
</template>
