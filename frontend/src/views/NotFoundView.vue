<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section>
    <h1>Page not found</h1>
    <p>The address you opened doesn’t match a page in Vue Skill Lab.</p>

    <RouterLink to="/">Return to dashboard</RouterLink>
  </section>
</template>
