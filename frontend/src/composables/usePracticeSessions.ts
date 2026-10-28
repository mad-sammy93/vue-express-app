import { computed, ref } from 'vue'

interface Session {
  id: number
  topic: string
  durationMinutes: number
}

interface SessionsResponse {
  data: Session[]
}

export function usePracticeSessions() {
  const sessions = ref<Session[]>([])
  const sessionsLoading = ref(false)
  const sessionsError = ref('')

  const totalMinutes = computed(() => {
    return sessions.value.reduce((total, session) => {
      return total + session.durationMinutes
    }, 0)
  })

  async function loadSessions(): Promise<void> {
    sessionsLoading.value = true
    sessionsError.value = ''

    try {
      const response = await fetch('/api/sessions')

      if (!response.ok) {
        throw new Error(`Unable to load sessions: ${response.status}`)
      }

      const result: SessionsResponse = await response.json()
      sessions.value = result.data
    } catch (error: unknown) {
      sessionsError.value = error instanceof Error ? error.message : 'Unable to load sessions'
    } finally {
      sessionsLoading.value = false
    }
  }

  return {
    //refs
    sessions,
    sessionsLoading,
    sessionsError,
    totalMinutes,
    //Methods
    loadSessions,
  }
}
