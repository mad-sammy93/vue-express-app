import {
    getAllSessions,
    createSession,
    deleteSessionById,
    updateSessionDuration
} from '../services/sessions.service.js'

export function listSessions(req, res) {
    const sessions = getAllSessions()

    res.json({
        data: sessions,
    })
}

export function addSession(req, res) {
    const { topic, durationMinutes } = req.body ?? {}

    if (typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({
            message: 'Topic is required',
        })
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({
            message: 'Duration must be a positive whole number',
        })
    }

    const session = createSession({
        topic: topic.trim(),
        durationMinutes,
    })

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

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({
            message: 'Duration must be a positive whole number',
        })
    }

    const session = updateSessionDuration(id, durationMinutes)

    if (!session) {
        return res.status(404).json({
            message: 'Session not found',
        })
    }

    return res.json({
        data: session,
    })
}