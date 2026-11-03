import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  it('returns the items for the selected page', () => {
    const items = ref([10, 20, 30, 40, 50])

    const { page, totalPages, paginatedItems } = usePagination(items, 2)

    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value).toEqual([10, 20])

    page.value = 2
    expect(paginatedItems.value).toEqual([30, 40])

    page.value = 3
    expect(paginatedItems.value).toEqual([50])
  })

  it('moves to the last valid page when items are removed', async () => {
    const items = ref([10, 20, 30, 40, 50])

    const { page, totalPages, paginatedItems } = usePagination(items, 2)

    page.value = 3

    items.value = [10, 20, 30]

    await nextTick()

    expect(totalPages.value).toBe(2)
    expect(page.value).toBe(2)
    expect(paginatedItems.value).toEqual([30])
  })

  it('rejects a page size of zero', () => {
    expect(() => usePagination([], 0)).toThrow('Page size must be a positive whole number')
  })

  it('returns to page one when all items are removed', async () => {
    const items = ref([10, 20, 30, 40, 50])

    const { page, totalPages, paginatedItems } = usePagination(items, 2)

    page.value = 3

    expect(paginatedItems.value).toEqual([50])

    items.value = []

    await nextTick()

    expect(page.value).toBe(1)
    expect(totalPages.value).toBe(1)
    expect(paginatedItems.value).toEqual([])
  })
})
