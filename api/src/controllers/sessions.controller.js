import {
    getAllSessions,
    createSession,
    deleteSessionById,
    updateSessionDuration
} from '../services/sessions.service.js'

export function listSessions(req, res) {
    const sessions = getAllSessions()
    console.log('\x1b[32m[LIST SESSIONS]\x1b[0m', sessions.length)
    res.json({
        data: sessions,
    })
}

export function addSession(req, res) {
    const { topic, durationMinutes } = req.body ?? {}

    const session = createSession({
        topic: topic.trim(),
        durationMinutes,
    })
    console.log('\x1b[32m[ADDED SESSIONS]\x1b[0m', session.id, session.topic, session.durationMinutes, `${session.durationMinutes === 1 ? 'minuite' : 'minuites'}`)
    return res.status(201).json({
        data: session,
    })
}

export function removeSession(req, res) {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Session ID must be a positive whole number',
        })
    }

    const deleted = deleteSessionById(id)

    if (!deleted) {
        return res.status(404).json({
            message: 'Session not found',
        })
    }
    console.log('\x1b[32m[DELETED SESSION]\x1b[0m', id)

    return res.status(204).send()
}

export function editSessionDuration(req, res) {
    const id = Number(req.params.id)
    const { durationMinutes } = req.body ?? {}

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Session ID must be a positive whole number',
        })
    }


    const session = updateSessionDuration(id, durationMinutes)

    if (!session) {
        return res.status(404).json({
            message: 'Session not found',
        })
    }
    console.log('\x1b[32m[EDITED SESSION]\x1b[0m', id, session.durationMinutes, `${session.durationMinutes === 1 ? 'minuite' : 'minuites'}`)

    return res.json({
        data: session,
    })
}