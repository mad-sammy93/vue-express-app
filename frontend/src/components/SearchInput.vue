<script setup lang="ts">
import { useTemplateRef } from 'vue'

defineProps<{
  label: string
  placeholder?: string
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })

const searchInput = useTemplateRef<HTMLInputElement>('search-input')

function focus(): void {
  searchInput.value?.focus()
}

function clearSearch(): void {
  model.value = ''
  focus()
}

defineExpose({ focus })
</script>

<template>
  <div>
    <label>
      <span>{{ label }}</span>

      <input
        v-model="model"
        type="search"
        :placeholder="placeholder"
        :disabled="disabled"
        ref="search-input"
      />
    </label>

    <button type="button" :disabled="disabled || model.length === 0" @click="clearSearch">
      Clear search
    </button>
  </div>
</template>

<style scoped>
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
