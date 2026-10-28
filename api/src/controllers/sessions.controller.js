import { getAllSessions } from '../services/sessions.service.js'

export function listSessions(req, res) {
    const sessions = getAllSessions()

    res.json({
        data: sessions,
    })
}