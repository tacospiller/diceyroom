<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import GoogleSignInButton from "../components/GoogleSignInButton.vue";
import HelloWorld from "../components/HelloWorld.vue";

const auth = useAuthStore();
const route = useRoute();

const oauthError = computed(() => route.query.error === "oauth");

onMounted(() => {
  // Try to restore a session from the refresh cookie on first load.
  if (auth.status === "idle") auth.loadSession();
});
</script>

<template>
  <main class="home">
    <template v-if="auth.status === 'idle' || auth.status === 'loading'">
      <p class="loading">Loading…</p>
    </template>

    <HelloWorld v-else-if="auth.isRegistered" />

    <section v-else class="signin">
      <h1>Welcome</h1>
      <p class="subtitle">Sign in to continue.</p>
      <p v-if="oauthError" class="error">
        Google sign-in failed. Please try again.
      </p>
      <GoogleSignInButton />
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.signin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
h1 {
  margin: 0;
}
.subtitle {
  margin: 0 0 0.5rem;
  color: #666;
}
.loading {
  color: #888;
}
.error {
  color: #d93025;
}
</style>
