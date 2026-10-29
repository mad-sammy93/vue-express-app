import type { Session, SessionsResponse } from '../types/session'

export async function fetchSessions(): Promise<Session[]> {
  const response = await fetch('/api/sessions')

  if (!response.ok) {
    throw new Error(`Unable to load sessions: ${response.status}`)
  }

  const result: SessionsResponse = await response.json()

  return result.data
}
