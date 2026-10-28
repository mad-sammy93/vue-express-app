import { Router } from 'express'
import { listSessions } from '../controllers/sessions.controller.js'

const router = Router()

router.get('/', listSessions)

export default router