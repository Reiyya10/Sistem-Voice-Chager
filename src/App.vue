<script setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import ToastNotification from './components/ToastNotification.vue'
</script>
<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="flex-1"><router-view /></main>
    <AppFooter />
    <ToastNotification />
  </div>
</template>
