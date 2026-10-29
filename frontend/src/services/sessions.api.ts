import type {
  Session,
  SessionsResponse,
  CreateSessionInput,
  UpdateSessionDurationInput,
} from '../types/session'
import type { ApiResponse, ApiErrorResponse } from '../types/api'
import { requestData } from './http'

export async function fetchSessions(): Promise<Session[]> {
  return requestData<Session[]>('/api/sessions')
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
