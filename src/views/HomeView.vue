<script setup>
import HeroSection from '../components/HeroSection.vue'
import CharacterCard from '../components/CharacterCard.vue'
import { characters } from '../store'
const steps = [['fa-microphone', 'Rekam', 'Rekam suaramu atau unggah file audio.'], ['fa-wand-magic-sparkles', 'Pilih Karakter', 'Pilih satu dari puluhan karakter orisinal.'], ['fa-download', 'Unduh', 'Dengar hasilnya lalu unduh.']]
</script>
<template>
  <HeroSection />
  <section class="wrap py-12">
    <div class="mb-6 flex items-center justify-between"><h2 class="text-2xl font-bold">Karakter Populer</h2><router-link to="/karakter" class="text-violet-400">Lihat Semua</router-link></div>
    <div class="grid grid-cols-2 gap-6 lg:grid-cols-4"><CharacterCard v-for="c in characters.slice(0, 4)" :key="c.id" :char="c" @select="$router.push('/karakter')" /></div>
  </section>
  <section class="wrap py-12">
    <h2 class="mb-6 text-2xl font-bold">Cara Kerja</h2>
    <div class="grid gap-6 md:grid-cols-3">
      <div v-for="(s, i) in steps" :key="s[1]" class="card"><i class="fa-solid text-2xl text-violet-400" :class="s[0]"></i><h3 class="mt-3 font-bold">{{ i + 1 }}. {{ s[1] }}</h3><p class="mt-1 text-slate-400">{{ s[2] }}</p></div>
    </div>
  </section>
</template>
