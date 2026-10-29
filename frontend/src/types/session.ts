export interface Session {
  id: number
  topic: string
  durationMinutes: number
}

export interface SessionsResponse {
  data: Session[]
}

export type CreateSessionInput = Pick<Session, 'topic' | 'durationMinutes'>

export type UpdateSessionDurationInput = Pick<Session, 'durationMinutes'>
