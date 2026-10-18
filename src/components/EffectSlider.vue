<script setup>
defineProps({ label: String, modelValue: Number })
defineEmits(['update:modelValue'])
</script>
<template>
  <label class="block">
    <span class="mb-1 flex justify-between text-sm"><span>{{ label }}</span><span class="font-mono text-violet-300">{{ modelValue }}</span></span>
    <input type="range" min="0" max="100" :value="modelValue" class="w-full accent-violet-500" @input="$emit('update:modelValue', Number($event.target.value))" />
  </label>
</template>
