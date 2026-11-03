import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

import app from '../src/app.js'
import { mockDatabase } from '../src/db/mockDatabase.js'

test('health endpoint confirms the backend is running', async () => {
    const response = await request(app)
        .get('/api/health')
        .expect(200)

    assert.equal(response.body.status, 'ok')
})

test('invalid duration is rejected without saving a session', async () => {
    const sessionsBefore = structuredClone(mockDatabase.sessions)

    const response = await request(app)
        .post('/api/sessions')
        .send({
            topic: 'Backend testing',
            durationMinutes: -5,
        })
        .expect(400)

    assert.equal(
        response.body.message,
        'Duration must be a positive whole number',
    )

    assert.deepEqual(mockDatabase.sessions, sessionsBefore)
})

test('whitespace-only topic is rejected without saving a session', async () => {
    const sessionsBefore = structuredClone(mockDatabase.sessions)

    const response = await request(app)
        .post('/api/sessions')
        .send({
            topic: '   ',
            durationMinutes: 25,
        })
        .expect(400)

    assert.equal(response.body.message, 'Topic is required')

    assert.deepEqual(mockDatabase.sessions, sessionsBefore)
})

test('creates, reads, updates, and deletes a session', async () => {
    const sessionsBefore = structuredClone(mockDatabase.sessions)

    try {
        // Create
        const created = await request(app)
            .post('/api/sessions')
            .send({
                topic: '  API integration testing  ',
                durationMinutes: 25,
            })
            .expect(201)

        const session = created.body.data

        assert.ok(Number.isSafeInteger(session.id))
        assert.ok(session.id > 0)
        assert.equal(session.topic, 'API integration testing')
        assert.equal(session.durationMinutes, 25)

        // Read
        const fetched = await request(app)
            .get(`/api/sessions/${session.id}`)
            .expect(200)

        assert.deepEqual(fetched.body.data, session)

        // Update
        const updated = await request(app)
            .patch(`/api/sessions/${session.id}`)
            .send({
                durationMinutes: 45,
            })
            .expect(200)

        assert.deepEqual(updated.body.data, {
            ...session,
            durationMinutes: 45,
        })

        // Verify the update was stored
        const fetchedAfterUpdate = await request(app)
            .get(`/api/sessions/${session.id}`)
            .expect(200)

        assert.equal(fetchedAfterUpdate.body.data.durationMinutes, 45)

        // Delete
        const deleted = await request(app)
            .delete(`/api/sessions/${session.id}`)
            .expect(204)

        assert.equal(deleted.text, '')

        // Verify the record no longer exists
        await request(app)
            .get(`/api/sessions/${session.id}`)
            .expect(404)
    } finally {
        mockDatabase.sessions = sessionsBefore
    }
})

test('unknown endpoints return a JSON error', async () => {
    const response = await request(app)
        .get('/api/does-not-exist')
        .expect('Content-Type', /json/)
        .expect(404)

    assert.equal(response.body.message, 'API endpoint not found')
})

test('malformed JSON returns a clear error without saving', async () => {
    const sessionsBefore = structuredClone(mockDatabase.sessions)

    const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{"topic":')
        .expect('Content-Type', /json/)
        .expect(400)

    assert.equal(
        response.body.message,
        'Request body must contain valid JSON',
    )

    assert.deepEqual(mockDatabase.sessions, sessionsBefore)
})