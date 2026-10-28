import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useSessionsStore = defineStore('sessions', () => {
  const completedSessions = ref<number>(0)
  const dailyGoal = ref<number>(5)

  const remainingSessions = computed(() => {
    return Math.max(dailyGoal.value - completedSessions.value, 0)
  })

  const isGoalReached = computed(() => {
    return completedSessions.value >= dailyGoal.value
  })

  function completeSession(): void {
    completedSessions.value++
  }

  function resetSession(): void {
    completedSessions.value = 0
  }

  return {
    completedSessions,
    dailyGoal,
    remainingSessions,
    isGoalReached,
    completeSession,
    resetSession,
  }
})
