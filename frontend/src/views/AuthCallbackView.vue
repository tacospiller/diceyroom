<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  // Existing users land here after Google OAuth; establish the session then go home.
  await auth.loadSession();
  router.replace("/");
});
</script>

<template>
  <main class="callback">
    <p>Signing you in…</p>
  </main>
</template>

<style scoped>
.callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}
</style>
