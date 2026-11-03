<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchSession } from '../services/sessions.api'
import type { Session } from '../types/session'

type SessionDetailsState =
  | { status: 'loading' }
  | { status: 'success'; data: Session }
  | { status: 'error'; message: string }

const route = useRoute()

const state = ref<SessionDetailsState>({
  status: 'loading',
})

watch(
  () => route.params.id,
  async (rawId, _previousId, onCleanup) => {
    let active = true
    const controller = new AbortController()

    onCleanup(() => {
      active = false
      controller.abort()
    })

    const id = typeof rawId === 'string' ? Number(rawId) : NaN

    if (!Number.isSafeInteger(id) || id <= 0) {
      state.value = {
        status: 'error',
        message: 'Invalid session ID',
      }
      return
    }

    state.value = { status: 'loading' }

    try {
      const session = await fetchSession(id, controller.signal)

      if (active) {
        state.value = {
          status: 'success',
          data: session,
        }
      }
    } catch (error: unknown) {
      if (active) {
        state.value = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to load session',
        }
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <RouterLink to="/">Back to dashboard</RouterLink>

  <h1>Session details</h1>

  <p v-if="state.status === 'loading'">Loading session...</p>

  <p v-else-if="state.status === 'error'" role="alert">
    {{ state.message }}
  </p>

  <article v-else-if="state.status === 'success'">
    <h2>{{ state.data.topic }}</h2>
    <p>Duration: {{ state.data.durationMinutes }} minutes</p>
    <p>Session ID: {{ state.data.id }}</p>
  </article>
</template>
