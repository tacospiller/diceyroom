<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPost, editPost, getPost, PostNotFoundError } from '@/api/posts'

type Mode = 'text' | 'voice' | 'offline' | 'other'

interface PostForm {
  // title/mode/maxMembers are UI-only — backend PostDocument does not store them.
  title: string
  rule: string
  mode: Mode
  maxMembers: number
  sessionDate: string
  recruitDeadline: string
  description: string
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
  mode: 'voice',
  maxMembers: 4,
  sessionDate: '',
  recruitDeadline: '',
  description: '',
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
    form.value = {
      title: '',
      rule: doc.rule,
      mode: 'voice',
      maxMembers: 4,
      sessionDate: toDateTimeLocal(doc.sessionDate),
      recruitDeadline: toDateInput(doc.recruitEndDate),
      description: doc.description,
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
    const sessionDateIso = form.value.sessionDate
      ? new Date(form.value.sessionDate).toISOString()
      : ''
    const recruitEndIso = form.value.recruitDeadline
      ? new Date(form.value.recruitDeadline).toISOString()
      : ''

    // title is folded into the first line of description so it survives the round trip
    // since the backend schema doesn't have a title field.
    const descWithTitle = form.value.title.trim()
      ? `${form.value.title.trim()}\n\n${form.value.description}`
      : form.value.description

    if (isEdit.value && editingId.value) {
      await editPost({
        key: editingId.value,
        rule: form.value.rule.trim(),
        description: descWithTitle,
        sessionDate: sessionDateIso,
        recruitEndDate: recruitEndIso,
      })
      router.push(`/posts/${editingId.value}`)
    } else {
      await createPost({
        rule: form.value.rule.trim(),
        description: descWithTitle,
        sessionDate: sessionDateIso,
        recruitEndDate: recruitEndIso,
      })
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
          placeholder="예: [D&D 5e] 입문자 환영, 원샷 모집합니다"
          maxlength="80"
        />
        <small v-if="titleError" class="error">{{ titleError }}</small>
      </div>

      <div class="row">
        <div class="field">
          <label for="rule">룰 시스템 <span class="req">*</span></label>
          <input
            id="rule"
            v-model="form.rule"
            type="text"
            placeholder="예: D&D 5e, Call of Cthulhu 7e"
          />
          <small v-if="ruleError" class="error">{{ ruleError }}</small>
        </div>

        <div class="field">
          <label for="mode">진행 방식</label>
          <select id="mode" v-model="form.mode">
            <option value="text">텍스트</option>
            <option value="voice">보이스</option>
            <option value="offline">오프라인</option>
            <option value="other">기타</option>
          </select>
        </div>

        <div class="field">
          <label for="max">최대 인원</label>
          <input
            id="max"
            v-model.number="form.maxMembers"
            type="number"
            min="2"
            max="20"
          />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="session">세션 일정</label>
          <input id="session" v-model="form.sessionDate" type="datetime-local" />
        </div>

        <div class="field">
          <label for="deadline">모집 마감일</label>
          <input id="deadline" v-model="form.recruitDeadline" type="date" />
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
  font-size: 0.85rem;
  font-weight: 600;
}

.req {
  color: var(--color-red);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.92rem;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--color-red);
}

.field textarea {
  resize: vertical;
  line-height: 1.6;
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
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
