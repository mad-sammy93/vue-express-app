import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePracticeSessions } from '../usePracticeSessions'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePracticeSessions', () => {
  it('loads sessions and calculates total minutes', async () => {
    const records = [
      { id: 1, topic: 'Vue reactivity', durationMinutes: 25 },
      { id: 2, topic: 'Props and events', durationMinutes: 30 },
    ]

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: records }), {
        status: 200,
      }),
    )

    const { sessions, totalMinutes, sessionsLoading, sessionsError, loadSessions } =
      usePracticeSessions()

    await loadSessions()

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', undefined)
    expect(sessions.value).toEqual(records)
    expect(totalMinutes.value).toBe(55)
    expect(sessionsLoading.value).toBe(false)
    expect(sessionsError.value).toBe('')
  })

  it('keeps a session when deletion fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }))

    const { sessions, deletingId, deleteError, deleteSession } = usePracticeSessions()

    sessions.value = [{ id: 1, topic: 'Vue reactivity', durationMinutes: 25 }]

    await deleteSession(1)

    expect(sessions.value).toEqual([{ id: 1, topic: 'Vue reactivity', durationMinutes: 25 }])
    expect(deleteError.value).toBe('Unable to delete session: 500')
    expect(deletingId.value).toBeNull()
  })

  it('successfully deletes a session', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    const { sessions, deletingId, deleteError, deleteSession } = usePracticeSessions()

    sessions.value = [{ id: 1, topic: 'Vue reactivity', durationMinutes: 25 }]

    await deleteSession(1)

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions/1', { method: 'DELETE' })
    expect(deleteError.value).toBe('')
    expect(sessions.value).toEqual([])
    expect(deletingId.value).toBeNull()
  })
})
