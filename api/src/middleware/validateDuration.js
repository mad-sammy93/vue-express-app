export function validateDuration(req, res, next) {
    const { durationMinutes } = req.body ?? {}

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({
            message: 'Duration must be a positive whole number',
        })
    }

    next()
}