import { Router } from 'express'
import {
    getHealth,
    getWelcome,
    getVersion
} from '../controllers/system.controller.js'

const router = Router()

router.get('/health', getHealth)
router.get('/welcome', getWelcome)
router.get('/version', getVersion)

export default router