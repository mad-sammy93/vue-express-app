import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSessionsStore } from '../sessions'

describe('sessions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('increases completed sessions and updates remaining sessions', () => {
    const store = useSessionsStore()

    store.completeSession()

    expect(store.completedSessions).toBe(1)
    expect(store.remainingSessions).toBe(4)
  })

  it('recognizes reaching the goal and keeps remaining sessions at zero', () => {
    const store = useSessionsStore()
    store.dailyGoal = 2

    store.completeSession()
    store.completeSession()

    expect(store.isGoalReached).toBe(true)
    expect(store.remainingSessions).toBe(0)

    store.completeSession()

    expect(store.remainingSessions).toBe(0)
  })
})
