import { mockDatabase } from '../db/mockDatabase.js'

export function getAllSessions(search = '') {
    const query = search.trim().toLowerCase()

    return mockDatabase.sessions
        .filter((session) => {
            return session.topic.toLowerCase().includes(query)
        })
        .map((session) => ({ ...session }))
}

export function createSession({ topic, durationMinutes }) {
    const nextId =
        Math.max(0, ...mockDatabase.sessions.map((session) => session.id)) + 1

    const session = {
        id: nextId,
        topic,
        durationMinutes,
    }

    mockDatabase.sessions.push(session)

    return { ...session }
}

export function deleteSessionById(id) {
    const index = mockDatabase.sessions.findIndex((session) => {
        return session.id === id
    })

    if (index === -1) {
        return false
    }

    mockDatabase.sessions.splice(index, 1)

    return true
}

export function updateSessionDuration(id, durationMinutes) {
    const session = mockDatabase.sessions.find((session) => {
        return session.id === id
    })

    if (!session) {
        return null
    }

    session.durationMinutes = durationMinutes

    return { ...session }
}

export function getSessionById(id) {
    const session = mockDatabase.sessions.find((session) => {
        return session.id === id
    })

    return session ? { ...session } : null
}