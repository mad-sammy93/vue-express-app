import { Router } from 'express'
import {
    listSessions,
    addSession,
    removeSession,
    editSessionDuration
} from '../controllers/sessions.controller.js'
import { validateDuration } from '../middleware/validateDuration.js'
import { validateTopic } from '../middleware/validateTopic.js'


const router = Router()

router.get('/', listSessions)
router.post('/', validateTopic, validateDuration, addSession)
router.delete('/:id', removeSession)
router.patch('/:id', validateDuration, editSessionDuration)

export default router