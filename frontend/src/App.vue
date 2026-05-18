<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <h1>Diceyroom</h1>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

nav {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
  font-weight: 600;
}
</style>
