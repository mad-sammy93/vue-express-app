export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error)
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'Request body must contain valid JSON',
        })
    }

    const status =
        Number.isInteger(error.status) &&
            error.status >= 400 &&
            error.status < 500
            ? error.status
            : 500

    if (status === 500) {
        console.error(error)
    }

    return res.status(status).json({
        message:
            status === 500
                ? 'An unexpected server error occurred'
                : 'The request could not be processed',
    })
}