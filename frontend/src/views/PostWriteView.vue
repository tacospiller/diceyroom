<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPost, editPost, getPost, PostNotFoundError } from '@/api/posts'
import { useMetaStore } from '@/stores/meta'
import AutocompleteInput from '@/components/AutocompleteInput.vue'
import sessionTextIcon from '@/assets/icons/session-text.svg?raw'
import sessionVoiceIcon from '@/assets/icons/session-voice.svg?raw'
import sessionOfflineIcon from '@/assets/icons/session-offline.svg?raw'


const metaStore = useMetaStore()

const PRESET_SESSION_MODES = new Set(['text', 'voice', 'offline', 'other'])

const sessionModeOptions = [
  { value: 'text', label: '텍스트', icon: sessionTextIcon },
  { value: 'voice', label: '보이스', icon: sessionVoiceIcon },
  { value: 'offline', label: '오프라인', icon: sessionOfflineIcon },
  { value: 'other', label: '기타' },
]

const sessionDateTypeOptions = [
  { value: 'fixed', label: '확정 날짜' },
  { value: 'range', label: '협의' },
  { value: 'autodate', label: '다이시룸 일정조정 툴 사용' },
]

const authorParticipateTypeOptions = [
  { value: 'gm', label: 'GM이에요' },
  { value: 'player', label: '플레이어예요' },
  { value: 'undecided', label: '미정이에요' },
  { value: 'none', label: '어느 쪽도 아니에요' },
]

interface PostForm {
  title: string
  rule: string
  sessionMode: string
  sessionModeOther: string
  sessionLocation: string
  sessionDateType: string
  sessionFixedDate: string
  sessionRangeDetails: string
  recruitEndsAt: string
  gmLimit: number
  playerLimit: number
  authorParticipateType: string
  publishParticipants: boolean
  acceptJoinRequests: boolean
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
  sessionMode: 'voice',
  sessionModeOther: '',
  sessionLocation: '',
  sessionDateType: 'fixed',
  sessionFixedDate: '',
  sessionRangeDetails: '',
  recruitEndsAt: '',
  gmLimit: 1,
  playerLimit: 4,
  authorParticipateType: 'gm',
  publishParticipants: true,
  acceptJoinRequests: false,
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
    const isPreset = PRESET_SESSION_MODES.has(doc.sessionMode)
    form.value = {
      title: doc.title,
      rule: doc.rule,
      sessionMode: isPreset ? doc.sessionMode : 'other',
      sessionModeOther: isPreset ? '' : doc.sessionMode,
      sessionLocation: doc.sessionLocation ?? '',
      sessionDateType: doc.sessionDateType,
      sessionFixedDate: toDateTimeLocal(String(doc.sessionFixedDate ?? '')),
      sessionRangeDetails: doc.sessionRangeDetails ?? '',
      recruitEndsAt: toDateInput(String(doc.recruitEndsAt ?? '')),
      gmLimit: doc.gmLimit,
      playerLimit: doc.playerLimit,
      authorParticipateType: 'gm',
      publishParticipants: doc.publishParticipants,
      acceptJoinRequests: doc.acceptJoinRequests,
      description: doc.description ?? '',
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
  form.value.rule.trim().length === 0 ? '사용 룰을 입력해 주세요.' : '',
)

const canSubmit = computed(
  () => !titleError.value && !ruleError.value && !submitting.value,
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
      sessionMode:
        form.value.sessionMode === 'other'
          ? form.value.sessionModeOther.trim() || 'other'
          : form.value.sessionMode,
      sessionLocation: form.value.sessionLocation.trim() || undefined,
      sessionDateType: form.value.sessionDateType,
      sessionFixedDate,
      sessionRangeDetails: form.value.sessionRangeDetails.trim() || undefined,
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

      <!-- 제목 -->
      <section class="section">
        <div class="field">
          <label for="title">제목 <span class="req">*</span></label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="구인글 제목을 입력해 주세요"
            maxlength="80"
          />
          <small v-if="titleError" class="error">{{ titleError }}</small>
        </div>
      </section>

      <!-- 세션은 어떻게 진행되나요? -->
      <section class="section">
        <h2 class="section-title">세션은 어떻게 진행되나요?</h2>

        <div class="field">
          <label for="rule">사용 룰 <span class="req">*</span></label>
          <AutocompleteInput
            v-model="form.rule"
            :options="metaStore.rules"
            placeholder="자동완성이 되지 않으면 직접 입력해 주세요"
          />
          <small v-if="ruleError" class="error">{{ ruleError }}</small>
        </div>

        <div class="field">
          <span class="field-label">진행 방식</span>
          <div class="radio-group">
            <template v-for="opt in sessionModeOptions" :key="opt.value">
              <input type="radio" v-model="form.sessionMode" :id="'mode-' + opt.value" :value="opt.value" />
              <template v-if="opt.value !== 'other'">
                <label :for="'mode-' + opt.value" class="radio-label">
                  <span v-if="opt.icon" v-html="opt.icon" class="mode-icon"></span>{{ opt.label }}
                </label>
              </template>
              <template v-else>
                <label :for="'mode-' + opt.value" class="radio-label">
                  <span v-if="opt.icon" v-html="opt.icon" class="mode-icon"></span>{{ opt.label }}
                </label>
                <input
                    v-model="form.sessionModeOther"
                    type="text"
                    class="other-input"
                    placeholder="직접 입력"
                    :disabled="form.sessionMode !== 'other'"
                    @focus="form.sessionMode = 'other'"
                  />
              </template>
            </template>
          </div>
        </div>

        <div class="field">
          <label for="location">세션 툴 또는 장소 <span class="optional">선택</span></label>
          <input
            id="location"
            v-model="form.sessionLocation"
            type="text"
            placeholder="ex) Roll20, 디스코드, 홍대 인근 스터디룸"
          />
        </div>
      </section>

      <!-- 언제 진행되나요? -->
      <section class="section">
        <h2 class="section-title">언제 진행되나요?</h2>

        <div class="field">
          <span class="field-label">세션 일정</span>
          <div class="radio-group">
            <template v-for="opt in sessionDateTypeOptions" :key="opt.value">
              <input type="radio" v-model="form.sessionDateType" :id="'dt-' + opt.value" :value="opt.value" />
              <label :for="'dt-' + opt.value" class="radio-label">{{ opt.label }}</label>
            </template>
          </div>
        </div>

        <div v-if="form.sessionDateType === 'fixed'" class="field">
          <label for="session-date">세션 날짜</label>
          <input id="session-date" v-model="form.sessionFixedDate" type="datetime-local" />
        </div>

        <div v-if="form.sessionDateType === 'range'" class="field">
          <label for="range-details">세션 날짜 범위 <span class="optional">선택</span></label>
          <input
            id="range-details"
            v-model="form.sessionRangeDetails"
            type="text"
            placeholder="ex) 3월 중 출발"
          />
        </div>

        <div class="field">
          <label for="deadline">모집 마감 일자 <span class="optional">선택</span></label>
          <input id="deadline" v-model="form.recruitEndsAt" type="date" />
        </div>
      </section>

      <!-- 누가 참여하나요? -->
      <section class="section">
        <h2 class="section-title">누가 참여하나요?</h2>

        <div class="row">
          <div class="field">
            <label for="gm-limit">GM 인원</label>
            <input id="gm-limit" v-model.number="form.gmLimit" type="number" min="0" max="10" />
          </div>
          <div class="field">
            <label for="player-limit">플레이어 인원</label>
            <input id="player-limit" v-model.number="form.playerLimit" type="number" min="1" max="20" />
          </div>
        </div>

        <div class="field">
          <span class="field-label">저(작성자)는</span>
          <div class="radio-group">
            <template v-for="opt in authorParticipateTypeOptions" :key="opt.value">
              <input type="radio" v-model="form.authorParticipateType" :id="'apt-' + opt.value" :value="opt.value" />
              <label :for="'apt-' + opt.value" class="radio-label">{{ opt.label }}</label>
            </template>
          </div>
        </div>

        <div class="field">
          <span class="field-label">참여자 프로필 공개</span>
          <div class="radio-group">
            <input type="radio" id="pub-yes" v-model="form.publishParticipants" :value="true" />
            <label for="pub-yes" class="radio-label">공개</label>
            <input type="radio" id="pub-no" v-model="form.publishParticipants" :value="false" />
            <label for="pub-no" class="radio-label">비공개</label>
          </div>
        </div>

        <div class="field">
          <span class="field-label">참가 신청 형식</span>
          <div class="radio-group">
            <input type="radio" id="req-yes" v-model="form.acceptJoinRequests" :value="true" />
            <label for="req-yes" class="radio-label">구인글을 통해 참여 신청 받기</label>
            <input type="radio" id="req-no" v-model="form.acceptJoinRequests" :value="false" />
            <label for="req-no" class="radio-label">참여자에게 직접 초대 링크 보내기</label>
          </div>
        </div>
      </section>

      <!-- 소개글 -->
      <section class="section">
        <h2 class="section-title">소개글 <span class="req">*</span></h2>
        <div class="field">
          <textarea
            id="desc"
            v-model="form.description"
            rows="10"
            placeholder="시나리오, 진행 방식, 준비물, 모집 대상 등을 자유롭게 적어주세요."
          ></textarea>
        </div>
      </section>

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
input[type='text'],
input[type='date'],
input[type='datetime-local'],
input[type='number'],
textarea,
select {
  border: 1px solid var(--color-faded-border);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.92rem;
}


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
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  overflow: hidden;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  padding-bottom: 3rem;
}

.section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--color-border);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label,
.field-label {
  font-size: 0.9rem;
  opacity: 0.75;
  font-weight: 600;
}

.req {
  color: var(--color-red);
}

.optional {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.6;
  margin-left: 0.25rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.85rem;
}

/* radio group */
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
  border: 1px solid var(--color-faded-border);
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
  border-color: var(--color-border);
}

.radio-group input[type='radio']:checked + .radio-label {
  border-color: var(--color-border);
  color: var(--color-text);
  font-weight: 600;
  opacity: 1;
}

.mode-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.mode-icon :deep(svg) {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.other-input {
  flex: 2.5;
  min-width: 60px;
  font-size: 0.85rem;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
}

.other-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* misc */
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
  margin: 1rem 1.5rem 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
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
