<template>
  <section class="wrap grid items-center gap-10 py-16 md:grid-cols-2">
    <div class="order-2 md:order-1">
      <h1 class="text-4xl font-bold leading-tight lg:text-6xl">Ubah Suara Kamu Jadi <span class="bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">Karakter Favorit!</span></h1>
      <p class="mt-4 text-lg text-slate-400">Voice changer AI untuk konten, game, dan hiburan. Rekam, pilih karakter, dan dengar hasilnya dalam hitungan detik.</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <router-link to="/voice-changer" class="btn-primary">Mulai Sekarang</router-link>
        <router-link to="/karakter" class="btn-ghost"><i class="fa-solid fa-play"></i> Dengar Demo</router-link>
      </div>
      <p class="mt-3 text-sm text-slate-500">Gratis 10 menit pertama. Tanpa kartu kredit.</p>
    </div>
    <div class="order-1 flex justify-center md:order-2" aria-hidden="true">
      <div class="flex h-64 w-64 items-center justify-center rounded-full bg-linear-to-br from-violet-600 via-fuchsia-500 to-cyan-400 shadow-2xl shadow-violet-600/30 lg:h-80 lg:w-80">
        <i class="fa-solid fa-microphone text-7xl text-white lg:text-8xl"></i>
      </div>
    </div>
  </section>
</template>
