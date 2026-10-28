<template>
  <h1>About Vue Skill Lab</h1>
  <p>A project for practising Vue 3, TypeScript, and Express.</p>

  <p>Completed sessions: {{ completedSessions }}</p>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSessionsStore } from '@/stores/sessions.ts'

const sessionsStore = useSessionsStore()

const { completedSessions } = storeToRefs(sessionsStore)
</script>

<style scoped></style>
