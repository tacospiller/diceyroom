<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPost, editPost, getPost, PostNotFoundError } from '@/api/posts'
import { useMetaStore } from '@/stores/meta'
import AutocompleteInput from '@/components/AutocompleteInput.vue'

const metaStore = useMetaStore()

const sessionModeOptions = [
  { value: 'text', label: '텍스트' },
  { value: 'voice', label: '보이스' },
  { value: 'offline', label: '오프라인' },
  { value: 'other', label: '기타' },
]

const PRESET_SESSION_MODES = new Set(['text', 'voice', 'offline', 'other'])

interface PostForm {
  title: string
  rule: string
  sessionMode: string
  sessionModeOther: string
  sessionDateType: string
  sessionFixedDate: string
  gmLimit: number
  playerLimit: number
  recruitEndsAt: string
  description: string
  publishParticipants: boolean
  acceptJoinRequests: boolean
  authorParticipateType: string
}

const route = useRoute()
const router = useRouter()

const editingId = computed(() => {
  const id = route.params.postid
  return typeof id === 'string' && id ? id : null
})

const isEdit = computed(() => editingId.value !== null)

const form = ref<PostForm>({
  title: '',
  rule: '',
  sessionMode: 'voice',
  sessionModeOther: '',
  sessionDateType: 'fixed',
  sessionFixedDate: '',
  gmLimit: 1,
  playerLimit: 4,
  recruitEndsAt: '',
  description: '',
  publishParticipants: false,
  acceptJoinRequests: false,
  authorParticipateType: 'gm',
})

const submitting = ref(false)
const loadError = ref('')
const submitError = ref('')

function toDateTimeLocal(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDateInput(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

onMounted(async () => {
  if (!isEdit.value) return
  try {
    const doc = await getPost(editingId.value as string)
    const isPreset = PRESET_SESSION_MODES.has(doc.sessionMode)
    form.value = {
      title: doc.title,
      rule: doc.rule,
      sessionMode: isPreset ? doc.sessionMode : 'other',
      sessionModeOther: isPreset ? '' : doc.sessionMode,
      sessionDateType: doc.sessionDateType,
      sessionFixedDate: toDateTimeLocal(String(doc.sessionFixedDate ?? '')),
      gmLimit: doc.gmLimit,
      playerLimit: doc.playerLimit,
      recruitEndsAt: toDateInput(String(doc.recruitEndsAt ?? '')),
      description: doc.description ?? '',
      publishParticipants: doc.publishParticipants,
      acceptJoinRequests: doc.acceptJoinRequests,
      authorParticipateType: 'gm',
    }
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      loadError.value = '존재하지 않는 구인글입니다.'
    } else {
      loadError.value = '구인글을 불러오지 못했습니다.'
    }
  }
})

const titleError = computed(() =>
  form.value.title.trim().length === 0 ? '제목을 입력해 주세요.' : '',
)
const ruleError = computed(() =>
  form.value.rule.trim().length === 0 ? '룰 시스템을 입력해 주세요.' : '',
)
const descError = computed(() =>
  form.value.description.trim().length < 10
    ? '소개는 10자 이상 작성해 주세요.'
    : '',
)

const canSubmit = computed(
  () => !titleError.value && !ruleError.value && !descError.value && !submitting.value,
)

async function submit() {
  if (!canSubmit.value) return
  submitError.value = ''
  submitting.value = true
  try {
    const sessionFixedDate = form.value.sessionFixedDate
      ? new Date(form.value.sessionFixedDate)
      : undefined
    const recruitEndsAt = form.value.recruitEndsAt
      ? new Date(form.value.recruitEndsAt).toISOString()
      : undefined

    const payload = {
      rule: form.value.rule.trim(),
      title: form.value.title,
      description: form.value.description,
      sessionMode: form.value.sessionMode === 'other'
        ? (form.value.sessionModeOther.trim() || 'other')
        : form.value.sessionMode,
      sessionDateType: form.value.sessionDateType,
      sessionFixedDate,
      gmLimit: form.value.gmLimit,
      playerLimit: form.value.playerLimit,
      recruitEndsAt,
      publishParticipants: form.value.publishParticipants,
      acceptJoinRequests: form.value.acceptJoinRequests,
      authorParticipateType: form.value.authorParticipateType,
    }

    if (isEdit.value && editingId.value) {
      await editPost(payload)
      router.push(`/posts/${editingId.value}`)
    } else {
      await createPost(payload)
      router.push('/profile/posts')
    }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      submitError.value = '로그인이 필요합니다.'
    } else {
      submitError.value = '저장 중 오류가 발생했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

function cancel() {
  router.back()
}
</script>

<template>
  <div class="post-write">
    <header class="page-head">
      <h1>{{ isEdit ? '구인글 수정' : '구인글 쓰기' }}</h1>
      <p class="hint">함께 할 동료를 모집하기 위한 정보를 입력해 주세요.</p>
    </header>

    <div v-if="loadError" class="error-msg">{{ loadError }}</div>

    <form v-else class="form" @submit.prevent="submit">
      <div class="field">
        <label for="title">제목 <span class="req">*</span></label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="ex) "
          maxlength="80"
        />
        <small v-if="titleError" class="error">{{ titleError }}</small>
      </div>

      <div class="row">
        <div class="field">
          <label for="rule">사용 룰 <span class="req">*</span></label>
          <AutocompleteInput
            v-model="form.rule"
            :options="metaStore.rules"
            placeholder="ex) 크툴루의 부름"
          />
          <small v-if="ruleError" class="error">{{ ruleError }}</small>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label>진행 방식</label>
          <div class="radio-group">
            <template v-for="opt in sessionModeOptions" :key="opt.value">
              <input type="radio" v-model="form.sessionMode" :id="opt.value" :value="opt.value" />
              <template v-if="opt.value !== 'other'"><label :for="opt.value" class="radio-label">{{ opt.label }}</label></template>
              <template v-else>
                <input
                  v-model="form.sessionModeOther"
                  type="text"
                  class="other-input"
                  placeholder="직접 입력"
                  @focus="form.sessionMode = 'other'"
                />
              </template>
            </template>
          </div>
        </div>

      </div>

      <div class="field">
        <label for="desc">소개 <span class="req">*</span></label>
        <textarea
          id="desc"
          v-model="form.description"
          rows="10"
          placeholder="시나리오, 진행 방식, 준비물, 모집 대상 등을 자유롭게 적어주세요."
        ></textarea>
        <small v-if="descError" class="error">{{ descError }}</small>
      </div>

      <p v-if="submitError" class="error-msg">{{ submitError }}</p>

      <div class="actions">
        <button type="button" class="secondary-btn" @click="cancel">취소</button>
        <button type="submit" class="primary-btn" :disabled="!canSubmit">
          {{ submitting ? '저장 중...' : isEdit ? '수정 완료' : '등록' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.post-write {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-head {
  margin-bottom: 1.5rem;
}

.page-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.hint {
  font-size: 0.9rem;
  opacity: 0.75;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-background);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 1.2rem;
  opacity: 0.8;
  font-weight: 600;
}

.req {
  color: var(--color-red);
}

.field input,
.field select,
.field textarea {
  width: 100%;
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.radio-group input[type='radio'] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.radio-group .radio-label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.7;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.radio-group .radio-label:hover {
  opacity: 1;
  border-color: var(--color-text);
}

.radio-group input[type='radio']:checked + .radio-label {
  border-color: var(--color-border);
  color: var(--color-text);
  font-weight: 600;
  opacity: 1;
}

.other-input {
  flex: 3;
  min-width: 60px;
  font-size: 0.85rem;
  border-color: var(--color-border);
  outline: none;
  background: transparent;
  color: inherit;
  opacity: 0.7;
}

.other-input:hover {
  opacity: 1;
}

.error {
  color: var(--color-red);
  font-size: 0.78rem;
}

.error-msg {
  color: var(--color-red);
  font-size: 0.85rem;
  background: var(--color-red-soft);
  border: 1px solid rgba(255, 56, 49, 0.35);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.primary-btn {
  background: var(--color-red);
  color: var(--color-text);
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
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

.secondary-btn {
  padding: 0.6rem 1.4rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  color: var(--color-text);
  background: var(--color-background);
}

.secondary-btn:hover {
  background: var(--color-red-soft);
  border-color: var(--color-red);
}
</style>
