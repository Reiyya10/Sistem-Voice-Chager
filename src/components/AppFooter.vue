<template>
  <footer class="border-t border-slate-800 bg-slate-900 py-10">
    <div class="wrap grid gap-8 md:grid-cols-3">
      <div><p class="flex items-center gap-2 text-lg font-bold"><i class="fa-solid fa-microphone text-violet-400"></i>SuaraKu</p>
        <p class="mt-2 text-sm text-slate-400">Voice changer AI untuk konten, game, dan hiburan.</p></div>
      <div class="flex flex-col gap-2 text-sm text-slate-400">
        <router-link to="/voice-changer">Voice Changer</router-link><router-link to="/karakter">Karakter</router-link><router-link to="/langganan">Premium</router-link></div>
      <div class="flex gap-4 text-xl text-slate-400"><i class="fa-brands fa-discord"></i><i class="fa-brands fa-instagram"></i><i class="fa-brands fa-youtube"></i></div>
    </div>
    <p class="wrap mt-8 text-sm text-slate-500">© 2026 SuaraKu. Semua hak dilindungi.</p>
  </footer>
</template>
