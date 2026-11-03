import express from 'express'
import systemRoutes from './routes/system.routes.js'
import sessionsRoutes from './routes/sessions.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(express.json())

app.use('/api', systemRoutes)
app.use('/api/sessions', sessionsRoutes)

// Runs when no route handled the request.
app.use((req, res) => {
    res.status(404).json({
        message: 'API endpoint not found',
    })
})

// Must come after the parser and routes.
app.use(errorHandler)

export default app