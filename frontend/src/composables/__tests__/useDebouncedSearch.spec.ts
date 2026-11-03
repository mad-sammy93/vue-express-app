import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import type { EffectScope } from 'vue'
import { useDebouncedSearch } from '../useDebouncedSearch'

type SearchCallback = (value: string, signal: AbortSignal) => Promise<void>

describe('useDebouncedSearch', () => {
  let scope: EffectScope

  beforeEach(() => {
    vi.useFakeTimers()
    scope = effectScope()
  })

  afterEach(() => {
    scope.stop()
    vi.useRealTimers()
  })

  it('loads immediately and restarts the delay when typing continues', async () => {
    const query = ref('')
    const search = vi.fn<SearchCallback>().mockResolvedValue(undefined)

    scope.run(() => {
      useDebouncedSearch(query, search, 300)
    })

    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenLastCalledWith('', expect.any(AbortSignal))

    query.value = 'v'
    await nextTick()

    vi.advanceTimersByTime(200)

    query.value = 'vue'
    await nextTick()

    vi.advanceTimersByTime(299)
    expect(search).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)

    expect(search).toHaveBeenCalledTimes(2)
    expect(search).toHaveBeenLastCalledWith('vue', expect.any(AbortSignal))
  })

  it('aborts active work and cancels pending searches when stopped', async () => {
    const query = ref('')
    const search = vi.fn<SearchCallback>().mockResolvedValue(undefined)

    scope.run(() => {
      useDebouncedSearch(query, search, 300)
    })

    const initialSignal = search.mock.calls[0]![1]

    expect(initialSignal.aborted).toBe(false)

    query.value = 'vue'
    await nextTick()

    expect(initialSignal.aborted).toBe(true)

    scope.stop()
    vi.advanceTimersByTime(300)

    // The pending search never starts.
    expect(search).toHaveBeenCalledTimes(1)
  })

  it('aborts the debounced search signal when stopped', async () => {
    const query = ref('')
    const search = vi.fn<SearchCallback>().mockResolvedValue(undefined)

    scope.run(() => {
      useDebouncedSearch(query, search, 300)
    })

    query.value = 'vue'
    await nextTick()

    vi.advanceTimersByTime(300)

    expect(search).toHaveBeenCalledTimes(2)

    const searchSignal = search.mock.calls[1]![1]

    expect(searchSignal.aborted).toBe(false)

    scope.stop()

    expect(searchSignal.aborted).toBe(true)
  })
})
