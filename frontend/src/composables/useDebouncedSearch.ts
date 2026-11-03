import { watch } from 'vue'
import type { Ref } from 'vue'

export function useDebouncedSearch(
  query: Readonly<Ref<string>>,
  search: (value: string, signal: AbortSignal) => Promise<void>,
  delay = 300,
) {
  watch(
    query,
    (value, previousValue, onCleanup) => {
      const controller = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined

      onCleanup(() => {
        if (timer !== undefined) {
          clearTimeout(timer)
        }

        controller.abort()
      })

      function runSearch(): void {
        void search(value, controller.signal)
      }

      if (previousValue === undefined) {
        runSearch()
        return
      }

      timer = setTimeout(runSearch, delay)
    },
    { immediate: true },
  )
}
