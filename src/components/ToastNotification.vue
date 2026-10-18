<script setup>
import { store } from '../store'
</script>
<template>
  <div v-if="store.toastMsg" role="status" class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-900 shadow-lg md:left-auto md:right-6 md:top-20 md:bottom-auto md:translate-x-0">
    <i class="fa-solid fa-check mr-2"></i>{{ store.toastMsg }}
  </div>
</template>
