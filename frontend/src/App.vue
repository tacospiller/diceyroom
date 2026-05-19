<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useMetaStore } from '@/stores/meta'

const metaStore = useMetaStore()
onMounted(() => metaStore.fetch())
</script>

<template>
  <div class="app">
    <AppHeader />

    <main class="site-main">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-main {
  flex: 1;
}
</style>
