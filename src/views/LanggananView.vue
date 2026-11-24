<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PricingCard from '../components/PricingCard.vue'
import { plans, store, toast, rupiah, apiPurchasePremium } from '../store'
const router = useRouter()
const chosen = ref(null), paying = ref(false)
function pick(p) {
  if (!store.loggedIn) { toast('Masuk dulu untuk berlangganan.'); return router.push('/masuk') }
  chosen.value = p
}
async function pay() {
  paying.value = true
  try {
    await apiPurchasePremium(chosen.value.months)
    toast('Premium aktif.')
    chosen.value = null
    router.push('/voice-changer')
  } catch (e) {
    toast(e.message)
  } finally {
    paying.value = false
  }
}
</script>
<template>
  <div class="wrap py-10">
    <h1 class="text-center text-4xl font-bold">Aktifkan Model RVC Premium</h1>
    <p class="mt-2 text-center text-slate-400">Akun baru mendapat Premium gratis selama 3 bulan. Setelah itu, pilih masa aktif 1 bulan atau 1 tahun.</p>
    <div class="mt-10 grid gap-6 md:grid-cols-2"><PricingCard v-for="p in plans" :key="p.id" :plan="p" :yearly="p.months === 12" :current="store.premium" @pick="pick" /></div>
    <p class="mt-6 text-center text-sm text-slate-400"><i class="fa-solid fa-shield-halved"></i> Pembelian gateway nyata belum terhubung; saat ini hanya mode demo.</p>
    <div v-if="chosen" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-6" @click.self="chosen = null">
      <div role="dialog" aria-modal="true" aria-label="Selesaikan Pembayaran" class="w-full max-w-lg space-y-4 rounded-t-2xl bg-slate-900 p-6 md:rounded-2xl">
        <h2 class="text-xl font-bold">Selesaikan Pembayaran</h2>
        <p>Paket {{ chosen.name }}</p>
        <p class="flex justify-between border-t border-slate-700 pt-3 font-bold"><span>Total</span><span>{{ rupiah(chosen.monthly) }}</span></p>
        <button class="btn-primary w-full" :disabled="paying" @click="pay"><i class="fa-solid fa-lock"></i> {{ paying ? 'Memproses...' : 'Aktifkan ' + rupiah(chosen.monthly) }}</button>
      </div>
    </div>
  </div>
</template>
