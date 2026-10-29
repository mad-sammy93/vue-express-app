import { computed, ref } from 'vue'
import type { Session, SessionsResponse } from '../types/session'
import {
  fetchSessions,
  deleteSessionRequest,
  createSessionRequest,
  updateDurationRequest,
} from '../services/sessions.api'

const isSaving = ref(false)
const saveError = ref('')

export function usePracticeSessions() {
  const sessions = ref<Session[]>([])
  const sessionsLoading = ref(false)
  const sessionsError = ref('')

  //Delete
  const deletingId = ref<number | null>(null)
  const deleteError = ref('')

  //Update
  const isUpdating = ref(false)
  const updateError = ref('')

  //Editing
  const editingId = ref<number | null>(null)
  const draftDuration = ref<number | string>(25)

  const totalMinutes = computed(() => {
    return sessions.value.reduce((total, session) => {
      return total + session.durationMinutes
    }, 0)
  })

  async function loadSessions(): Promise<void> {
    sessionsLoading.value = true
    sessionsError.value = ''

    try {
      sessions.value = await fetchSessions()
    } catch (error: unknown) {
      sessionsError.value = error instanceof Error ? error.message : 'Unable to load sessions'
    } finally {
      sessionsLoading.value = false
    }
  }

  async function saveSession(topic: string, durationMinutes: number): Promise<boolean> {
    if (isSaving.value) return false

    isSaving.value = true
    saveError.value = ''

    try {
      const session = await createSessionRequest({
        topic,
        durationMinutes,
      })

      sessions.value.push(session)

      return true
    } catch (error: unknown) {
      saveError.value = error instanceof Error ? error.message : 'Unable to save session'

      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteSession(id: number): Promise<void> {
    if (deletingId.value !== null) return

    deletingId.value = id
    deleteError.value = ''

    try {
      await deleteSessionRequest(id)

      sessions.value = sessions.value.filter((session) => {
        return session.id !== id
      })
    } catch (error: unknown) {
      deleteError.value = error instanceof Error ? error.message : 'Unable to delete session'
    } finally {
      deletingId.value = null
    }
  }

  async function updateDuration(id: number, durationMinutes: number): Promise<boolean> {
    if (isUpdating.value) return false

    isUpdating.value = true
    updateError.value = ''

    try {
      const updatedSession = await updateDurationRequest(id, {
        durationMinutes,
      })

      sessions.value = sessions.value.map((session) => {
        return session.id === id ? updatedSession : session
      })

      return true
    } catch (error: unknown) {
      updateError.value = error instanceof Error ? error.message : 'Unable to update session'

      return false
    } finally {
      isUpdating.value = false
    }
  }

  function startEditing(id: number, durationMinutes: number): void {
    editingId.value = id
    draftDuration.value = durationMinutes
    updateError.value = ''
  }

  function cancelEditing(): void {
    editingId.value = null
    updateError.value = ''
  }

  async function saveEditing(): Promise<void> {
    if (editingId.value === null) return

    const saved = await updateDuration(editingId.value, Number(draftDuration.value))

    if (saved) {
      cancelEditing()
    }
  }

  return {
    //refs
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
    //Methods
    loadSessions,
    saveSession,
    deleteSession,
    updateDuration,
    startEditing,
    saveEditing,
    cancelEditing,
  }
}
