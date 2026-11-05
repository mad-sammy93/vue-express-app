<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { createSessionSchema } from '@/types/session'
import { useSessionsStore } from '@/stores/sessions.ts'
import { usePracticeSessions } from '@/composables/usePracticeSessions'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppPanel from '@/components/AppPanel.vue'
import SearchInput from '@/components/SearchInput.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import SessionList from '@/components/SessionList.vue'
import SessionControls from '@/components/SessionControls.vue'
import DeleteSessionDialog from '@/components/DeleteSessionDialog.vue'
import { fetchSessionsPage } from '@/services/sessions.api'

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
  isSaving,
  saveError,
  deletingId,
  deleteError,
  isUpdating,
  updateError,
  editingId,
  draftDuration,
  sessionsRevision,
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

// Delete Session
const deleteDialog = useTemplateRef<InstanceType<typeof DeleteSessionDialog>>('delete-dialog')

const pendingDeleteId = ref<number | null>(null)

function requestDelete(id: number): void {
  pendingDeleteId.value = id
  deleteDialog.value?.open()
}

function cancelDelete(): void {
  pendingDeleteId.value = null
}

async function confirmDelete(): Promise<void> {
  const id = pendingDeleteId.value

  if (id === null) return

  pendingDeleteId.value = null
  await deleteSession(id)
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

// Moved to composible
useUnsavedChanges(hasUnsavedChanges)

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
        page: undefined,
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
        page: undefined,
      },
      hash: route.hash,
    })
  },
})

const totalPages = ref(1)
const totalMatches = ref(0)
const pageSize = 2
const page = computed<number>({
  get() {
    const value = route.query.page
    const parsed = typeof value === 'string' ? Number(value) : NaN

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1
  },

  set(value) {
    void router.replace({
      query: {
        ...route.query,
        page: value === 1 ? undefined : String(value),
      },
      hash: route.hash,
    })
  },
})

watch(
  [searchQuery, sortBy, page, sessionsRevision],
  ([search, sort, requestedPage], [previousSearch], onCleanup) => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    onCleanup(() => {
      if (timer !== undefined) clearTimeout(timer)
      controller.abort()
    })

    sessionsLoading.value = true
    sessionsError.value = ''

    async function loadPage(): Promise<void> {
      try {
        const result = await fetchSessionsPage(
          { search, sort, page: requestedPage, limit: pageSize },
          controller.signal,
        )

        if (controller.signal.aborted) return

        totalPages.value = result.meta.totalPages
        totalMatches.value = result.meta.total

        if (requestedPage > result.meta.totalPages) {
          page.value = result.meta.totalPages
          return
        }

        sessions.value = result.data
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        sessionsError.value = error instanceof Error ? error.message : 'Unable to load sessions'
      } finally {
        if (!controller.signal.aborted) {
          sessionsLoading.value = false
        }
      }
    }

    if (previousSearch !== undefined && search !== previousSearch) {
      timer = setTimeout(() => void loadPage(), 300)
    } else {
      void loadPage()
    }
  },
  { immediate: true },
)

// Start from page 1 when the search or sort changes.
watch([searchQuery, sortBy], () => {
  page.value = 1
})

// Keep the page valid when records are removed.
watch(totalPages, (count) => {
  page.value = Math.min(page.value, count)
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
      @click="sessionsRevision++"
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
        <p>Showing {{ sessions.length }} of {{ totalMatches }} matching sessions.</p>
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
    <SessionList v-else-if="sessions.length > 0" :sessions="sessions">
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
            @click="requestDelete(session.id)""
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
      v-if="!sessionsLoading && !sessionsError && totalMatches > 0"
      v-model:page="page"
      :total-pages="totalPages"
      :disabled="editingId !== null"
    />
    <p>
      Time on this page:
      {{ sessions.reduce((total, session) => total + session.durationMinutes, 0) }} minutes
      <!-- ({{ visibleMinuitesOnPage }} on this page) -->
    </p>
  </section>
  <DeleteSessionDialog
    ref="delete-dialog"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
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
