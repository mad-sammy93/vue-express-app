import type { Session, CreateSessionInput, UpdateSessionDurationInput } from '../types/session'
import { sessionsSchema, sessionSchema } from '../types/session'
import { requestData } from './http'

export async function fetchSessions(search = '', signal?: AbortSignal): Promise<Session[]> {
  const query = new URLSearchParams()

  if (search.trim()) {
    query.set('q', search.trim())
  }

  const url = query.size > 0 ? `/api/sessions?${query.toString()}` : '/api/sessions'

  const data = await requestData<unknown>(url, signal ? { signal } : undefined)

  const result = sessionsSchema.safeParse(data)

  if (!result.success) {
    throw new Error('The server returned invalid session data')
  }

  return result.data
}

export async function createSessionRequest(input: CreateSessionInput): Promise<Session> {
  return requestData<Session>('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function deleteSessionRequest(id: number): Promise<void> {
  const response = await fetch(`/api/sessions/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Unable to delete session: ${response.status}`)
  }
}

export async function updateDurationRequest(
  id: number,
  input: UpdateSessionDurationInput,
): Promise<Session> {
  return requestData<Session>(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function fetchSession(id: number, signal?: AbortSignal): Promise<Session> {
  const data = await requestData<unknown>(`/api/sessions/${id}`, { signal })

  const result = sessionSchema.safeParse(data)

  if (!result.success) {
    throw new Error('The server returned invalid session data')
  }

  return result.data
}
