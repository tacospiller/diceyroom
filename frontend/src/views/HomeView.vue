<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <main>
    <h2>Home</h2>
    <p>Welcome to Diceyroom.</p>
    <button type="button" @click="counter.increment">
      count is {{ counter.count }} (double: {{ counter.doubleCount }})
    </button>
  </main>
</template>

<style scoped>
main {
  padding: 2rem;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
