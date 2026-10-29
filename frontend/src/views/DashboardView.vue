<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import SessionControls from '../components/SessionControls.vue'
import { useSessionsStore } from '@/stores/sessions.ts'
import { usePracticeSessions } from '../composables/usePracticeSessions'

interface HealthResponse {
  status: string
  message: string
}

const sessionsStore = useSessionsStore()

//Backend
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

// Composables
const {
  sessions,
  sessionsLoading,
  sessionsError,
  totalMinutes,
  isSaving,
  saveError,
  deletingId,
  deleteError,
  isUpdating,
  updateError,
  editingId,
  draftDuration,
  loadSessions,
  saveSession,
  deleteSession,
  startEditing,
  saveEditing,
  cancelEditing,
} = usePracticeSessions()

// Save Sessions State
const topic = ref('')
const durationMinutes = ref<number | string>(25)
async function submitSession(): Promise<void> {
  const saved = await saveSession(topic.value, Number(durationMinutes.value))

  if (saved) {
    topic.value = ''
    durationMinutes.value = 25
  }
}

onMounted(() => {
  void loadSessions()
})
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

    <button
      :disabled="sessionsLoading || deletingId !== null || editingId !== null"
      @click="loadSessions"
    >
      {{ sessionsLoading ? 'Loading...' : 'Load sessions' }}
    </button>

    <form @submit.prevent="submitSession">
      <h2>Add a practice session</h2>

      <fieldset :disabled="isSaving || editingId !== null">
        <label for="session-topic">Topic</label>
        <input id="session-topic" v-model.trim="topic" required />

        <label for="session-duration">Duration in minutes</label>
        <input
          id="session-duration"
          v-model.number="durationMinutes"
          type="number"
          min="1"
          step="1"
          required
        />

        <button type="submit">
          {{ isSaving ? 'Saving...' : 'Add session' }}
        </button>
      </fieldset>

      <p v-if="saveError" role="alert">{{ saveError }}</p>
    </form>

    <p v-if="sessionsLoading">Loading practice sessions...</p>

    <p v-else-if="sessionsError" role="alert">
      {{ sessionsError }}
    </p>

    <ul v-else-if="sessions.length > 0">
      <li v-for="session in sessions" :key="session.id">
        <template v-if="editingId === session.id">
          <form @submit.prevent="saveEditing">
            <label :for="`duration-${session.id}`">
              {{ session.topic }} — duration in minutes
            </label>

            <input
              :id="`duration-${session.id}`"
              v-model.number="draftDuration"
              type="number"
              min="1"
              step="1"
              required
              :disabled="isUpdating"
            />

            <button
              type="submit"
              :disabled="isUpdating || session.durationMinutes === draftDuration"
            >
              {{ isUpdating ? 'Saving...' : 'Save' }}
            </button>

            <button type="button" :disabled="isUpdating" @click="cancelEditing">Cancel</button>

            <p v-if="updateError" role="alert">{{ updateError }}</p>
          </form>
        </template>

        <template v-else>
          {{ session.topic }} — {{ session.durationMinutes }} minutes

          <button
            type="button"
            :disabled="editingId !== null || deletingId !== null || sessionsLoading || isSaving"
            @click="startEditing(session.id, session.durationMinutes)"
          >
            Edit
          </button>

          <button
            type="button"
            :disabled="editingId !== null || deletingId !== null || sessionsLoading || isSaving"
            @click="deleteSession(session.id)"
          >
            {{ deletingId === session.id ? 'Deleting...' : 'Delete' }}
          </button>
        </template>
      </li>
    </ul>

    <p v-else>No practice sessions yet. Add your first one above.</p>
    <p v-if="deleteError" role="alert">{{ deleteError }}</p>

    <p>Total practice time: {{ totalMinutes }} minutes</p>
  </section>
</template>

<style scoped>
button {
  padding: 10px 16px;
  cursor: pointer;
}
</style>
