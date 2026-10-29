export function validateTopic(req, res, next) {
    const { topic } = req.body ?? {}

    if (typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({
            message: 'Topic is required',
        })
    }

    next()
}