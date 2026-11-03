import { watch } from 'vue'
import type { Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

export function useUnsavedChanges(hasUnsavedChanges: Readonly<Ref<boolean>>) {
  onBeforeRouteLeave(() => {
    if (!hasUnsavedChanges.value) {
      return true
    }

    return window.confirm('You have unsaved changes. Leave this page and discard them?')
  })

  watch(
    hasUnsavedChanges,
    (hasChanges, _previousValue, onCleanup) => {
      if (!hasChanges) return

      function handleBeforeUnload(event: BeforeUnloadEvent): void {
        event.preventDefault()
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      onCleanup(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      })
    },
    { immediate: true },
  )
}
