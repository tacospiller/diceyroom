<script setup lang="ts">
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import CreateProfileForm from "../components/CreateProfileForm.vue";

const route = useRoute();

// The backend redirects new users to /register#ticket=<jwt>.
const ticket = ref(
  new URLSearchParams(route.hash.replace(/^#/, "")).get("ticket")
);
</script>

<template>
  <main class="register">
    <CreateProfileForm v-if="ticket" :registration-ticket="ticket" />
    <section v-else class="missing">
      <h1>Registration link expired</h1>
      <p>Please start again from the sign-in page.</p>
      <RouterLink to="/">Go to sign in</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.register {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.missing {
  text-align: center;
}
</style>
