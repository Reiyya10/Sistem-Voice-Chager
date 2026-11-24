<script setup>
defineProps({
  label: String,
  modelValue: Number,
  minValue: { type: Number, default: 0 },
  maxValue: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>
<template>
  <label class="block">
    <span class="mb-1 flex justify-between text-sm"><span>{{ label }}</span><span class="font-mono text-violet-300">{{ modelValue }}{{ unit }}</span></span>
    <input type="range" :min="minValue" :max="maxValue" :step="step" :value="modelValue" class="w-full accent-violet-500" @input="$emit('update:modelValue', Number($event.target.value))" />
  </label>
</template>
