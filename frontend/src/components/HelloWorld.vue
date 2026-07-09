<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
}
</script>

<template>
  <section class="hello">
    <img
      v-if="auth.user?.profileImageUrl"
      :src="auth.user.profileImageUrl"
      :alt="auth.user.username"
      class="avatar"
    />
    <h1>Hello world</h1>
    <p class="who">Signed in as <strong>{{ auth.user?.username }}</strong></p>
    <button type="button" class="logout" @click="onLogout">Log out</button>
  </section>
</template>

<style scoped>
.hello {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
}
h1 {
  margin: 0;
  font-size: 2rem;
}
.who {
  margin: 0;
  color: #555;
}
.logout {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  color: #333;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
}
.logout:hover {
  background: #f5f5f5;
}
</style>
