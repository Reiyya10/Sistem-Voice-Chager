<script setup>
import { computed } from 'vue'
import { rupiah } from '../store'
const props = defineProps({ plan: Object, yearly: Boolean, current: Boolean })
defineEmits(['pick'])
const price = computed(() => (props.yearly ? Math.round(props.plan.monthly * 0.8) : props.plan.monthly))
</script>
<template>
  <div class="card relative flex flex-col transition hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-600/20" :class="plan.popular && 'border-violet-500 md:-mt-4 md:pb-10'">
    <span v-if="plan.popular" class="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold">Paling Populer</span>
    <h3 class="text-xl font-bold">{{ plan.name }}</h3>
    <p class="mt-3 text-3xl font-bold">{{ rupiah(price) }}<span class="text-base font-normal text-slate-400"> / bulan</span></p>
    <p v-if="yearly && plan.monthly" class="text-sm text-slate-400">ditagih {{ rupiah(price * 12) }} per tahun</p>
    <ul class="my-6 flex-1 space-y-2 text-sm">
      <li v-for="f in plan.features" :key="f"><i class="fa-solid fa-check mr-2 text-emerald-400"></i>{{ f }}</li>
    </ul>
    <button :class="plan.popular ? 'btn-primary' : 'btn-ghost'" :disabled="current" @click="$emit('pick', plan)">{{ current ? 'Paket Saat Ini' : plan.monthly ? 'Pilih ' + plan.name : 'Mulai Gratis' }}</button>
  </div>
</template>
