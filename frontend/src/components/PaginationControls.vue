<script setup lang="ts">
defineProps<{
  totalPages: number
  disabled?: boolean
}>()

const page = defineModel<number>('page', {
  required: true,
})

const firstPage = () => {
  page.value = 1
}
</script>

<template>
  <nav aria-label="Session pagination">
    <button
      type="button"
      data-test="first-page"
      :disabled="disabled || page <= 1"
      @click="page = 1"
    >
      First page
    </button>
    <button
      type="button"
      :disabled="disabled || page <= 1"
      @click="page--"
      data-test="previous-page"
    >
      Previous
    </button>

    <span aria-live="polite"> Page {{ page }} of {{ totalPages }} </span>

    <button
      type="button"
      :disabled="disabled || page >= totalPages"
      @click="page++"
      data-test="next-page"
    >
      Next
    </button>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
</style>
