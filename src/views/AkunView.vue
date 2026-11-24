<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { store, toast, apiAccount, apiLogout } from '../store'
const router = useRouter()
onMounted(apiAccount)
const premiumDate = computed(() => store.premiumUntil ? new Date(store.premiumUntil).toLocaleDateString('id-ID') : '-')
async function logout() {
  await apiLogout()
  toast('Berhasil keluar.')
  router.push('/')
}
</script>
<template>
  <div class="wrap space-y-6 py-10">
    <h1 class="text-3xl font-bold">Akun Saya</h1>
    <section class="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-slate-400">Paket saat ini</p>
        <p class="text-2xl font-bold"><i v-if="store.premium" class="fa-solid fa-crown mr-2 text-amber-400"></i>{{ store.premium ? 'Premium' : 'Gratis' }}</p>
        <p class="text-slate-400">{{ store.premium ? 'Aktif sampai ' + premiumDate : 'Akses model RVC belum aktif' }}</p>
        <p class="mt-1 text-sm text-slate-400">{{ store.userName }} · {{ store.userEmail }}</p>
      </div>
      <div class="flex gap-3"><router-link to="/langganan" class="btn-ghost">{{ store.premium ? 'Perpanjang Premium' : 'Aktifkan Premium' }}</router-link><button class="btn-ghost text-red-400" @click="logout">Keluar</button></div>
    </section>
  </div>
</template>
