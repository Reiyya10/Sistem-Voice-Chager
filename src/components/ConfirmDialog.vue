<script setup>
defineProps({ title: String, text: String, okText: { type: String, default: 'Ya' } })
defineEmits(['ok', 'cancel'])
</script>
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="$emit('cancel')">
    <div role="alertdialog" aria-modal="true" class="w-full max-w-sm rounded-2xl bg-slate-900 p-6">
      <h2 class="text-lg font-bold">{{ title }}</h2>
      <p class="mt-2 text-slate-400">{{ text }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button class="btn-ghost" @click="$emit('cancel')">Batal</button>
        <button class="btn-primary" @click="$emit('ok')">{{ okText }}</button>
      </div>
    </div>
  </div>
</template>
