<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { login, InvalidCredentialsError } from '@/api/accounts'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const remember = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const canSubmit = computed(
  () =>
    username.value.trim().length > 0 &&
    password.value.length > 0 &&
    !submitting.value,
)

async function submit() {
  if (!canSubmit.value) return
  errorMsg.value = ''
  submitting.value = true
  try {
    const session = await login(username.value.trim(), password.value)
    userStore.setSession(session)
    router.push('/')
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      errorMsg.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
    } else {
      errorMsg.value = '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <span class="logo-icon">🎲</span>
        <span class="logo-text">DiceyRoom</span>
      </div>

      <h1>로그인</h1>
      <p class="sub">계정에 로그인하고 동료를 찾아보세요.</p>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label for="username">아이디</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="아이디를 입력하세요"
          />
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호를 입력하세요"
          />
        </div>

        <label class="remember">
          <input v-model="remember" type="checkbox" />
          <span>로그인 상태 유지</span>
        </label>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="primary-btn" :disabled="!canSubmit">
          {{ submitting ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <div class="auth-foot">
        <span>아직 계정이 없으신가요?</span>
        <RouterLink to="/signup">회원가입</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 1.25rem;
}

.logo-icon {
  font-size: 1.4rem;
}

h1 {
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.3rem;
}

.sub {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.75;
  margin-bottom: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
}

.field input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.92rem;
}

.field input:focus {
  outline: none;
  border-color: var(--color-red);
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.error-msg {
  color: var(--color-red);
  font-size: 0.85rem;
  background: var(--color-red-soft);
  border: 1px solid rgba(255, 56, 49, 0.35);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.primary-btn {
  background: var(--color-red);
  color: var(--color-text);
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.primary-btn:hover:not(:disabled) {
  background: var(--color-red-hover);
}

.primary-btn:disabled {
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.auth-foot {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.88rem;
  opacity: 0.85;
}

.auth-foot a {
  color: var(--color-red);
  font-weight: 600;
  margin-left: 0.4rem;
}

.auth-foot a:hover {
  text-decoration: underline;
}
</style>
