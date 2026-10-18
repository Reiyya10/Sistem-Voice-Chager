<script setup>
import { isLocked } from '../store'
defineProps({ char: Object, selected: Boolean })
defineEmits(['select'])
</script>
<template>
  <button type="button" class="group relative flex flex-col items-center gap-2 rounded-2xl border bg-slate-800 p-4 text-center transition hover:shadow-lg hover:shadow-violet-600/20 focus-visible:outline-2 focus-visible:outline-violet-400"
    :class="[selected ? 'border-violet-500' : 'border-slate-700', isLocked(char) && 'opacity-60']" @click="$emit('select', char)">
    <span class="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br ring-[3px] ring-violet-600" :class="char.bg">
      <i class="fa-solid text-3xl text-white" :class="isLocked(char) ? 'fa-lock' : selected ? 'fa-check' : 'fa-wave-square'"></i>
    </span>
    <span class="font-semibold">{{ char.name }}</span>
    <span class="flex gap-1 text-xs text-slate-300"><span v-for="t in char.tags" :key="t" class="rounded-full bg-slate-700 px-2 py-0.5">{{ t }}</span></span>
    <span class="text-xs text-amber-400"><i class="fa-solid fa-star"></i> {{ char.rating }} <span class="text-slate-400">dari {{ char.votes }} penilaian</span></span>
    <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="char.premium ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'">{{ char.premium ? 'PREMIUM' : 'GRATIS' }}</span>
  </button>
</template>
