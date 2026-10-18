<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PricingCard from '../components/PricingCard.vue'
import { plans, store, toast, rupiah } from '../store'
const router = useRouter()
const yearly = ref(false), chosen = ref(null), method = ref('QRIS'), agree = ref(false), paying = ref(false)
const methods = ['QRIS', 'GoPay', 'OVO', 'DANA', 'Transfer Bank']
const total = computed(() => (chosen.value ? Math.round(chosen.value.monthly * (yearly.value ? 0.8 : 1) * 1.11) * (yearly.value ? 12 : 1) : 0))
function pick(p) {
  if (!p.monthly) return toast('Kamu sudah memakai paket Gratis.')
  if (!store.loggedIn) { toast('Masuk dulu untuk berlangganan.'); return router.push('/masuk') }
  chosen.value = p; agree.value = false
}
function pay() {
  paying.value = true
  setTimeout(() => {
    store.plan = chosen.value.id; store.credits = chosen.value.id === 'pro' ? 300 : 1500
    toast('Paket ' + chosen.value.name + ' aktif.'); paying.value = false; chosen.value = null; router.push('/voice-changer')
  }, 1500)
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="text-center text-4xl font-bold">Buka Semua Suara, Tanpa Batas.</h1>
    <p class="mt-2 text-center text-slate-400">Pilih paket yang cocok. Batalkan kapan saja.</p>
    <div class="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-slate-800 p-1">
      <button class="rounded-full px-5 py-2" :class="!yearly && 'bg-violet-600'" @click="yearly = false">Bulanan</button>
      <button class="rounded-full px-5 py-2" :class="yearly && 'bg-violet-600'" @click="yearly = true">Tahunan <span class="ml-1 rounded bg-emerald-400 px-1.5 text-xs font-bold text-slate-900">Hemat 20%</span></button>
    </div>
    <div class="mt-10 grid gap-6 md:grid-cols-3"><PricingCard v-for="p in plans" :key="p.id" :plan="p" :yearly="yearly" :current="store.plan === p.id" @pick="pick" /></div>
    <p class="mt-6 text-center text-sm text-slate-400"><i class="fa-solid fa-shield-halved"></i> Mode demo: tidak ada pembayaran sungguhan.</p>
    <div v-if="chosen" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-6" @click.self="chosen = null">
      <div role="dialog" aria-modal="true" aria-label="Selesaikan Pembayaran" class="w-full max-w-lg space-y-4 rounded-t-2xl bg-slate-900 p-6 md:rounded-2xl">
        <h2 class="text-xl font-bold">Selesaikan Pembayaran</h2>
        <p>Paket {{ chosen.name }} ({{ yearly ? 'tahunan' : 'bulanan' }})</p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3"><label v-for="m in methods" :key="m" class="cursor-pointer rounded-xl border p-3 text-center text-sm" :class="method === m ? 'border-violet-500 bg-violet-600/20' : 'border-slate-700'"><input v-model="method" type="radio" :value="m" class="sr-only" />{{ m }}</label></div>
        <label class="flex items-center gap-2 text-sm"><input v-model="agree" type="checkbox" class="accent-violet-500" /> Saya menyetujui Syarat dan Ketentuan.</label>
        <p class="flex justify-between border-t border-slate-700 pt-3 font-bold"><span>Total (termasuk PPN 11%)</span><span>{{ rupiah(total) }}</span></p>
        <button class="btn-primary w-full" :disabled="!agree || paying" @click="pay"><i class="fa-solid fa-lock"></i> {{ paying ? 'Memproses...' : 'Bayar ' + rupiah(total) }}</button>
      </div>
    </div>
  </div>
</template>
