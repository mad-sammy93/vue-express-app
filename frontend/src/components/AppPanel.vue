<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="panel">
    <header>
      <slot name="header">
        <h2>{{ title }}</h2>
      </slot>
    </header>

    <div>
      <slot />
    </div>

    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.panel {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 12px;
}

footer {
  margin-top: 16px;
  color: #555;
}
</style>
