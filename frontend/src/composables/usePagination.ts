import { computed, ref, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function usePagination<T>(items: MaybeRefOrGetter<readonly T[]>, pageSize = 2) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('Page size must be a positive whole number')
  }

  const page = ref(1)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(toValue(items).length / pageSize))
  })

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize

    return toValue(items).slice(start, start + pageSize)
  })

  watch(totalPages, (count) => {
    page.value = Math.min(page.value, count)
  })

  return {
    page,
    totalPages,
    paginatedItems,
  }
}
