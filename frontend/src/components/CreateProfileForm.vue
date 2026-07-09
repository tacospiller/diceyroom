<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { usernameAvailable, ApiError } from "../api/client";

const props = defineProps<{ registrationTicket: string }>();

const router = useRouter();
const auth = useAuthStore();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const username = ref("");
const availability = ref<"unknown" | "checking" | "available" | "taken">(
  "unknown"
);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

const usernameValid = computed(() => USERNAME_RE.test(username.value));
const canSubmit = computed(
  () =>
    usernameValid.value &&
    availability.value === "available" &&
    !submitting.value
);

// Debounced availability check.
let debounce: ReturnType<typeof setTimeout> | undefined;
watch(username, (value) => {
  availability.value = "unknown";
  if (debounce) clearTimeout(debounce);
  if (!USERNAME_RE.test(value)) return;

  availability.value = "checking";
  debounce = setTimeout(async () => {
    const checking = value;
    try {
      const free = await usernameAvailable(checking);
      // Ignore stale responses if the input changed meanwhile.
      if (checking !== username.value) return;
      availability.value = free ? "available" : "taken";
    } catch {
      if (checking === username.value) availability.value = "unknown";
    }
  }, 400);
});

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imageFile.value = file;
  imagePreview.value = file ? URL.createObjectURL(file) : null;
}

onBeforeUnmount(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
});

async function submit() {
  if (!canSubmit.value) return;
  submitting.value = true;
  errorMessage.value = null;
  try {
    await auth.register({
      registrationTicket: props.registrationTicket,
      username: username.value,
      profileImage: imageFile.value,
    });
    router.push("/");
  } catch (err) {
    errorMessage.value =
      err instanceof ApiError ? err.message : "Registration failed";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="profile-form" @submit.prevent="submit">
    <h1>Create your profile</h1>
    <p class="subtitle">Choose a username to finish signing up.</p>

    <label class="field">
      <span>Username</span>
      <input
        v-model.trim="username"
        type="text"
        autocomplete="off"
        placeholder="3–20 letters, numbers, or _"
        :aria-invalid="username.length > 0 && !usernameValid"
      />
      <small v-if="username && !usernameValid" class="hint error">
        Must be 3–20 characters: letters, numbers, or underscore.
      </small>
      <small v-else-if="availability === 'checking'" class="hint">
        Checking availability…
      </small>
      <small v-else-if="availability === 'available'" class="hint ok">
        “{{ username }}” is available.
      </small>
      <small v-else-if="availability === 'taken'" class="hint error">
        “{{ username }}” is taken.
      </small>
    </label>

    <label class="field">
      <span>Profile image <em>(optional)</em></span>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="onFileChange" />
    </label>

    <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="preview" />

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <button type="submit" :disabled="!canSubmit">
      {{ submitting ? "Creating…" : "Create profile" }}
    </button>
  </form>
</template>

<style scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 360px;
  text-align: left;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
}
.subtitle {
  margin: 0;
  color: #666;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 500;
}
.field input[type="text"] {
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.field input[type="text"][aria-invalid="true"] {
  border-color: #d93025;
}
.hint {
  font-weight: 400;
  color: #666;
}
.hint.ok {
  color: #188038;
}
.hint.error {
  color: #d93025;
}
.preview {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #ddd;
}
.form-error {
  margin: 0;
  color: #d93025;
}
button[type="submit"] {
  padding: 0.65rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
  background: #1a73e8;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button[type="submit"]:disabled {
  background: #9cc0f5;
  cursor: not-allowed;
}
</style>
