<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { join, InvalidUsernameError, UsernameTakenError } from '@/api/accounts'
import { sha256Hex } from '@/api/hash'

const router = useRouter()

const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const agreed = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

const usernameError = computed(() => {
  const u = username.value.trim()
  if (u.length === 0) return ''
  if (u.length < 3) return '아이디는 3자 이상이어야 합니다.'
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return '영문, 숫자, _만 사용할 수 있습니다.'
  return ''
})

const passwordError = computed(() => {
  if (password.value.length === 0) return ''
  if (password.value.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
  return ''
})

const confirmError = computed(() => {
  if (passwordConfirm.value.length === 0) return ''
  if (passwordConfirm.value !== password.value)
    return '비밀번호가 일치하지 않습니다.'
  return ''
})

const canSubmit = computed(
  () =>
    username.value.trim().length >= 3 &&
    password.value.length >= 8 &&
    passwordConfirm.value === password.value &&
    agreed.value &&
    !usernameError.value &&
    !submitting.value,
)

async function submit() {
  if (!canSubmit.value) return
  errorMsg.value = ''
  submitting.value = true
  try {
    const passhash = await sha256Hex(password.value)
    await join(username.value.trim(), passhash)
    router.push('/login')
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      errorMsg.value = '이미 사용 중인 아이디입니다.'
    } else if (err instanceof InvalidUsernameError) {
      errorMsg.value = '아이디 형식이 올바르지 않습니다.'
    } else {
      errorMsg.value = '회원가입 중 오류가 발생했습니다.'
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

      <h1>회원가입</h1>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label for="username">아이디</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="3~20자, 영문/숫자/_"
          />
          <small v-if="usernameError" class="error">{{ usernameError }}</small>
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="8자 이상"
          />
          <small v-if="passwordError" class="error">{{ passwordError }}</small>
        </div>

        <div class="field">
          <label for="confirm">비밀번호 확인</label>
          <input
            id="confirm"
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            placeholder="비밀번호를 한 번 더 입력하세요"
          />
          <small v-if="confirmError" class="error">{{ confirmError }}</small>
        </div>

        <label class="agree">
          <input v-model="agreed" type="checkbox" />
          <span>이용약관 및 개인정보처리방침에 동의합니다.</span>
        </label>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="primary-btn" :disabled="!canSubmit">
          {{ submitting ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <div class="auth-foot">
        <span>이미 계정이 있으신가요?</span>
        <RouterLink to="/login">로그인</RouterLink>
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
  max-width: 420px;
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

.error {
  color: var(--color-red);
  font-size: 0.78rem;
}

.agree {
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
