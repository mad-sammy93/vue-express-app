<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  RouterLink,
  // onBeforeRouteLeave
} from 'vue-router'
import { storeToRefs } from 'pinia'
import SessionControls from '../components/SessionControls.vue'
import { useSessionsStore } from '@/stores/sessions.ts'
import { usePracticeSessions } from '../composables/usePracticeSessions'
import { useUnsavedChanges } from '../composables/useUnsavedChanges'
import SearchInput from '../components/SearchInput.vue'
import AppPanel from '../components/AppPanel.vue'
import SessionList from '../components/SessionList.vue'
import { createSessionSchema } from '../types/session'

interface HealthResponse {
  status: string
  message: string
}

const sessionsStore = useSessionsStore()

//Backend
const backendMessage = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

//search
const searchQuery = ref(localStorage.getItem('skill-lab-search') ?? '')
//zod  validation
const validationError = ref('')

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
  validationError.value = ''
  saveError.value = ''

  const result = createSessionSchema.safeParse({
    topic: topic.value,
    durationMinutes: Number(durationMinutes.value),
  })

  if (!result.success) {
    validationError.value = result.error.issues[0]?.message ?? 'Please check your input'

    return
  }

  const saved = await saveSession(result.data.topic, result.data.durationMinutes)

  if (saved) {
    topic.value = ''
    durationMinutes.value = 25
  }
}

const hasUnsavedChanges = computed(() => {
  const hasNewSessionDraft = topic.value !== '' || Number(durationMinutes.value) !== 25

  if (editingId.value === null) {
    return hasNewSessionDraft
  }

  const originalSession = sessions.value.find((session) => {
    return session.id === editingId.value
  })

  const hasEditedDuration =
    originalSession !== undefined && Number(draftDuration.value) !== originalSession.durationMinutes

  return hasNewSessionDraft || hasEditedDuration
})

useUnsavedChanges(hasUnsavedChanges)

// onBeforeRouteLeave(() => {
//   if (!hasUnsavedChanges.value) {
//     return true
//   }

//   return window.confirm('You have unsaved changes. Leave this page and discard them?')
// })

//Search functionality
const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return sessions.value.filter((session) => {
    return session.topic.toLowerCase().includes(query)
  })
})
const clearSearch = () => {
  searchQuery.value = ''
}

const visibleMinutes = computed(() => {
  return filteredSessions.value.reduce((total, session) => {
    return total + session.durationMinutes
  }, 0)
})

onMounted(() => {
  void loadSessions()
})
watch(searchQuery, (newQuery) => {
  localStorage.setItem('skill-lab-search', newQuery)
})
</script>

<template>
  <session class="hide">
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
  </session>
  <section class="hide">
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
    <AppPanel title="Find practice sessions">
      <template #header>
        <h2>Search practice sessions</h2>
      </template>
      <SearchInput
        v-model="searchQuery"
        label="Search sessions"
        placeholder="Search by topic"
        :disabled="sessionsLoading"
      />

      <template #footer>
        <p>Showing {{ filteredSessions.length }} of {{ sessions.length }} sessions</p>
      </template>
    </AppPanel>
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
      <p v-if="validationError" role="alert">
        {{ validationError }}
      </p>
    </form>

    <p v-if="sessionsLoading">Loading practice sessions...</p>

    <p v-else-if="sessionsError" role="alert">
      {{ sessionsError }}
    </p>
    <SessionList v-else-if="filteredSessions.length > 0" :sessions="filteredSessions">
      <template #item="{ session }">
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

        <RouterLink :to="{ name: 'session-details', params: { id: session.id } }">
          View details
        </RouterLink>
      </template>
    </SessionList>
    <!-- <ul v-else-if="filteredSessions.length > 0"></ul> -->

    <p v-else>No practice sessions yet. Add your first one above.</p>
    <p v-if="deleteError" role="alert">{{ deleteError }}</p>

    <p>Total practice time: {{ visibleMinutes }} minutes</p>
  </section>
</template>

<style scoped>
button {
  padding: 10px 16px;
  cursor: pointer;
}
.hide {
  display: none;
}
</style>
