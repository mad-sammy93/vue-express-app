<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import {
  RouterLink,
  // onBeforeRouteLeave,
  useRoute,
  useRouter,
} from 'vue-router'
import { storeToRefs } from 'pinia'
import { createSessionSchema } from '@/types/session'
import { useSessionsStore } from '@/stores/sessions.ts'
import { usePracticeSessions } from '@/composables/usePracticeSessions'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { usePagination } from '@/composables/usePagination'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import AppPanel from '@/components/AppPanel.vue'
import SearchInput from '@/components/SearchInput.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import SessionList from '@/components/SessionList.vue'
import SessionControls from '@/components/SessionControls.vue'

const route = useRoute() // Route - for Routing and reading URL params
const router = useRouter() // Router - for Routing

// Types
interface HealthResponse {
  status: string
  message: string
}
type SessionSort = 'topic' | 'duration' | 'duration-asc'

const sessionsStore = useSessionsStore()

//Backend
const backendMessage = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

//search
// const searchQuery = ref(localStorage.getItem('skill-lab-search') ?? '') // REMOVED TO facilitate url based search
const searchControl = useTemplateRef<InstanceType<typeof SearchInput>>('dashboard-search')

// Using zod fot validation
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

const searchQuery = computed<string>({
  get() {
    const query = route.query.q

    return typeof query === 'string' ? query : ''
  },

  set(value) {
    void router.replace({
      query: {
        ...route.query,
        q: value === '' ? undefined : value,
      },
      hash: route.hash,
    })
  },
})

// shortcut: press / to focus search
function handleSearchShortcut(event: KeyboardEvent): void {
  if (
    event.key !== '/' ||
    event.defaultPrevented ||
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  ) {
    return
  }

  const target = event.target

  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select'))
  ) {
    return
  }

  if (sessionsLoading.value) return

  event.preventDefault()
  searchControl.value?.focus()
}

onMounted(() => {
  window.addEventListener('keydown', handleSearchShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleSearchShortcut)
})

const sortBy = computed<SessionSort>({
  get() {
    const sort = route.query.sort

    if (sort === 'duration' || sort === 'duration-asc') {
      return sort
    }

    return 'topic'
  },

  set(value) {
    void router.replace({
      query: {
        ...route.query,
        sort: value === 'topic' ? undefined : value,
      },
      hash: route.hash,
    })
  },
})

//Search functionality
const filteredSessions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return sessions.value.filter((session) => {
    return session.topic.toLowerCase().includes(query)
  })
})

const sortedSessions = computed(() => {
  const result = [...filteredSessions.value]

  return result.sort((first, second) => {
    if (sortBy.value === 'duration') {
      return second.durationMinutes - first.durationMinutes
    }

    if (sortBy.value === 'duration-asc') {
      return first.durationMinutes - second.durationMinutes
    }

    return first.topic.localeCompare(second.topic)
  })
})

const { page, totalPages, paginatedItems: paginatedSessions } = usePagination(sortedSessions, 2)

useDebouncedSearch(searchQuery, loadSessions, 300)

// Start from page 1 when the search or sort changes.
watch([searchQuery, sortBy], () => {
  page.value = 1
})

// Keep the page valid when records are removed.
watch(totalPages, (count) => {
  page.value = Math.min(page.value, count)
})

const visibleMinutes = computed(() => {
  return filteredSessions.value.reduce((total, session) => {
    return total + session.durationMinutes
  }, 0)
})

const visibleMinuitesOnPage = computed(() => {
  return paginatedSessions.value.reduce((total, session) => {
    return total + session.durationMinutes
  }, 0)
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
    <h1 data-test="dashboard-title" class="dashboard-title">Practice sessions</h1>

    <button
      :disabled="sessionsLoading || deletingId !== null || editingId !== null"
      @click="loadSessions(searchQuery)"
    >
      {{ sessionsLoading ? 'Loading...' : 'Load sessions' }}
    </button>
    <AppPanel title="Find practice sessions">
      <template #header>
        <h2>Search practice sessions</h2>
      </template>
      <SearchInput
        ref="dashboard-search"
        v-model="searchQuery"
        label="Search sessions"
        placeholder="Search by topic"
      />
      <p>Press / to focus search when you aren’t typing in a field.</p>
      <label for="session-sort">Sort sessions</label>

      <select id="session-sort" v-model="sortBy">
        <option value="topic">Topic A–Z</option>
        <option value="duration">Longest duration first</option>
        <option value="duration-asc">Shortest duration first</option>
      </select>

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
    <SessionList v-else-if="sortedSessions.length > 0" :sessions="paginatedSessions">
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

    <PaginationControls
      v-if="sortedSessions.length > 0"
      v-model:page="page"
      :total-pages="totalPages"
      :disabled="editingId !== null"
    />
    <p>
      Total practice time: {{ visibleMinutes }} minutes ({{ visibleMinuitesOnPage }} on this page)
    </p>
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
