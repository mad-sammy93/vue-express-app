<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import SessionControls from '../components/SessionControls.vue'
import { useSessionsStore } from '@/stores/sessions.ts'

interface HealthResponse {
  status: string
  message: string
}

const sessionsStore = useSessionsStore()

const backendMessage = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function checkBackend(): Promise<void> {
  //Initialize Refs
  isLoading.value = true
  errorMessage.value = ''
  backendMessage.value = ''

  try {
    const response = await fetch('/api/health')

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    const data: HealthResponse = await response.json()
    backendMessage.value = data.message
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to reach backend'
  } finally {
    isLoading.value = false
  }
}

const { completedSessions, dailyGoal, remainingSessions, isGoalReached } =
  storeToRefs(sessionsStore)

const { completeSession, resetSession } = sessionsStore
</script>

<template>
  <h1>Vue Skill Lab</h1>

  <label for="daily-goal">Daily session goal:</label>

  <input id="daily-goal" v-model.number="dailyGoal" type="number" min="1" />

  <p>Remaining sessions: {{ remainingSessions }}</p>

  <p>Completed sessions: {{ completedSessions }}</p>
  <p v-if="completedSessions > 0 && !isGoalReached">You’re making progress!</p>

  <p v-else-if="completedSessions > 0 && isGoalReached">You reached your daily goal!🎉</p>

  <SessionControls
    :can-reset="completedSessions > 0"
    :is-goal-reached="isGoalReached"
    @complete="completeSession"
    @reset="resetSession"
  />

  <section>
    <h2>Backend connection</h2>

    <button :disabled="isLoading" @click="checkBackend">
      {{ isLoading ? 'Checking...' : 'Check backend' }}
    </button>

    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <p v-else-if="backendMessage">{{ backendMessage }}</p>
  </section>
  <section>
    <h2>Practice sessions</h2>

    <button :disabled="sessionsLoading" @click="loadSessions">
      {{ sessionsLoading ? 'Loading...' : 'Load sessions' }}
    </button>

    <p v-if="sessionsLoading">Loading practice sessions...</p>

    <p v-else-if="sessionsError" role="alert">
      {{ sessionsError }}
    </p>

    <ul v-else-if="sessions.length > 0">
      <li v-for="session in sessions" :key="session.id">
        {{ session.topic }} — {{ session.durationMinutes }} minutes
      </li>
    </ul>

    <p>Total minutes: {{ totalMinutes }}</p>
  </section>
</template>

<style scoped>
button {
  padding: 10px 16px;
  cursor: pointer;
}
</style>
