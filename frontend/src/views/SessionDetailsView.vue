<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchSession } from '../services/sessions.api'
import type { Session } from '../types/session'

const route = useRoute()

const session = ref<Session | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

watch(
  () => route.params.id,
  async (rawId, _previousId, onCleanup) => {
    let active = true
    const controller = new AbortController()

    onCleanup(() => {
      active = false
      controller.abort()
    })

    session.value = null
    errorMessage.value = ''
    isLoading.value = false

    const id = typeof rawId === 'string' ? Number(rawId) : NaN

    if (!Number.isSafeInteger(id) || id <= 0) {
      errorMessage.value = 'Invalid session ID'
      return
    }

    isLoading.value = true

    try {
      const result = await fetchSession(id, controller.signal)

      if (active) {
        session.value = result
      }
    } catch (error: unknown) {
      if (active) {
        errorMessage.value = error instanceof Error ? error.message : 'Unable to load session'
      }
    } finally {
      if (active) {
        isLoading.value = false
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <RouterLink to="/">Back to dashboard</RouterLink>

  <h1>Session details</h1>

  <p v-if="isLoading">Loading session...</p>

  <p v-else-if="errorMessage" role="alert">
    {{ errorMessage }}
  </p>

  <article v-else-if="session">
    <h2>{{ session.topic }}</h2>
    <p>Duration: {{ session.durationMinutes }} minutes</p>
    <p>Session ID: {{ session.id }}</p>
  </article>
</template>
