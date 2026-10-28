<script setup lang="ts">
defineProps<{
  canReset: boolean
  isGoalReached: boolean
}>()

const emit = defineEmits<{
  complete: []
  reset: []
}>()
</script>

<template>
  <button @click="emit('complete')">
    {{ isGoalReached ? `Complete another session` : `Complete a session` }}
  </button>

  <button :disabled="!canReset" @click="emit('reset')">Reset sessions</button>
</template>

<style scoped>
button {
  padding: 10px 16px;
  cursor: pointer;
}
</style>
