<script setup lang="ts">
import type { Session } from '@/types/session'

defineProps<{
  sessions: Session[]
}>()
</script>

<template>
  <ul>
    <li v-for="session in sessions" :key="session.id">
      <slot name="item" :session="session">
        {{ session.topic }} — {{ session.durationMinutes }} minutes
      </slot>
    </li>
  </ul>
</template>

<style scoped>
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
