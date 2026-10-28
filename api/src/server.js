import express from 'express'
import systemRoutes from './routes/system.routes.js'
import sessionsRoutes from './routes/sessions.routes.js'

const app = express()
const port = 3000

app.use('/api', systemRoutes)
app.use('/api/sessions', sessionsRoutes)

app.listen(port, () => {
    console.log(`API server is running at http://localhost:${port}`)
})