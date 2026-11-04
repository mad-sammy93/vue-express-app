import {
    getAllSessions,
    createSession,
    deleteSessionById,
    updateSessionDuration,
    getSessionById,
    getSessionsPage
} from '../services/sessions.service.js'


export function listSessions(req, res) {
    const search = req.query.q
    const sort = req.query.sort ?? 'topic'
    const allowedSorts = ['topic', 'duration', 'duration-asc']
    const wantsPagination =
        req.query.page !== undefined ||
        req.query.limit !== undefined

    if (search !== undefined && typeof search !== 'string') {
        return res.status(400).json({
            message: 'Search query must be a single string',
        })
    }

    if (typeof sort !== 'string' || !allowedSorts.includes(sort)) {
        return res.status(400).json({
            message: 'Sort must be topic, duration, or duration-asc',
        })
    }

    if (wantsPagination) {
        const rawPage = req.query.page ?? '1'
        const rawLimit = req.query.limit ?? '10'

        if (typeof rawPage !== 'string' || typeof rawLimit !== 'string') {
            return res.status(400).json({
                message: 'Page and limit must be single values',
            })
        }

        const page = Number(rawPage)
        const limit = Number(rawLimit)

        if (!Number.isSafeInteger(page) || page < 1) {
            return res.status(400).json({
                message: 'Page must be a positive whole number',
            })
        }

        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                message: 'Limit must be a whole number between 1 and 100',
            })
        }

        return res.json(
            getSessionsPage(search ?? '', sort, page, limit),
        )
    }

    const sessions = getAllSessions(search ?? '', sort)

    return res.json({
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

export function getSession(req, res) {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: 'Session ID must be a positive whole number',
        })
    }

    const session = getSessionById(id)

    if (!session) {
        return res.status(404).json({
            message: 'Session not found',
        })
    }

    return res.json({
        data: session,
    })
}