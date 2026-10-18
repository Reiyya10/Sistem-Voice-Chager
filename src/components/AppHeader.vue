<script setup>
import { ref } from 'vue'
import { store } from '../store'
const open = ref(false)
const links = [['/', 'Beranda'], ['/voice-changer', 'Voice Changer'], ['/karakter', 'Karakter'], ['/rekaman', 'Rekaman'], ['/tentang', 'Tentang'], ['/langganan', 'Premium']]
</script>
<template>
  <header class="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
    <div class="wrap flex h-16 items-center justify-between">
      <router-link to="/" class="flex items-center gap-2 text-lg font-bold"><i class="fa-solid fa-microphone text-violet-400"></i>SuaraKu</router-link>
      <nav class="hidden gap-6 lg:flex" aria-label="Menu utama">
        <router-link v-for="l in links" :key="l[0]" :to="l[0]" class="text-slate-300 hover:text-white" active-class="!text-violet-400 font-semibold">
          <i v-if="l[1] === 'Premium'" class="fa-solid fa-crown mr-1 text-amber-400"></i>{{ l[1] }}
        </router-link>
      </nav>
      <div class="hidden lg:block">
        <router-link v-if="store.loggedIn" to="/akun" class="btn-ghost"><i class="fa-solid fa-user"></i> Akun</router-link>
        <router-link v-else to="/masuk" class="btn-primary">Masuk</router-link>
      </div>
      <button class="p-2 lg:hidden" aria-label="Buka menu" @click="open = !open"><i class="fa-solid" :class="open ? 'fa-xmark' : 'fa-bars'"></i></button>
    </div>
    <nav v-if="open" class="flex flex-col gap-3 border-t border-slate-800 px-4 py-4 lg:hidden" @click="open = false">
      <router-link v-for="l in links" :key="l[0]" :to="l[0]" class="py-1 text-slate-200" active-class="!text-violet-400">{{ l[1] }}</router-link>
      <router-link :to="store.loggedIn ? '/akun' : '/masuk'" class="btn-primary">{{ store.loggedIn ? 'Akun Saya' : 'Masuk' }}</router-link>
    </nav>
  </header>
</template>
