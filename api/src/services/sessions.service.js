import { mockDatabase } from '../db/mockDatabase.js'

export function getAllSessions() {
    return mockDatabase.sessions.map((session) => ({ ...session }))
}