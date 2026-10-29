import { Router } from 'express'
import {
    listSessions,
    addSession,
    removeSession,
    editSessionDuration
} from '../controllers/sessions.controller.js'

const router = Router()

router.get('/', listSessions)
router.post('/', addSession)
router.delete('/:id', removeSession)
router.patch('/:id', editSessionDuration)

export default router