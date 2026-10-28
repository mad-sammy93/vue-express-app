export function getHealth(req, res) {
    res.json({
        status: 'ok',
        message: 'Backend is running',
    })
}

export function getWelcome(req, res) {
    res.json({
        message: 'Welcome to Vue Skill Lab',
    })
}

export function getVersion(req, res) {
    res.json({
        version: '1.0.0'
    })
}