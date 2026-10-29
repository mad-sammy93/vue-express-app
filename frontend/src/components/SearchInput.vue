<script setup lang="ts">
defineProps<{
  label: string
  placeholder?: string
  disableSearch?: boolean
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label>
      <span>{{ label }}</span>

      <input v-model="model" type="search" :placeholder="placeholder" :disabled="disableSearch" />
    </label>

    <button type="button" :disabled="model.length === 0 || disableSearch" @click="model = ''">
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
