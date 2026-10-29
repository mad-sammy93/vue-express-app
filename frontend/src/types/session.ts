export interface Session {
  id: number
  topic: string
  durationMinutes: number
}

export interface SessionsResponse {
  data: Session[]
}
