<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const profile = ref({
  displayName: 'Min',
  bio: 'Call of Cthulhu 7e 키퍼. 입문자에게 친절한 진행을 지향합니다.',
  avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Min',
})

const notifications = ref({
  applyReceived: true,
  applyAccepted: true,
  comments: true,
  marketing: false,
})

const password = ref({
  current: '',
  next: '',
  confirm: '',
})

const saving = ref(false)
const savedMsg = ref('')

async function saveProfile() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 300))
  saving.value = false
  savedMsg.value = '프로필이 저장되었습니다.'
  setTimeout(() => (savedMsg.value = ''), 2000)
}

async function changePassword() {
  if (password.value.next !== password.value.confirm) {
    alert('새 비밀번호가 일치하지 않습니다.')
    return
  }
  if (password.value.next.length < 8) {
    alert('비밀번호는 8자 이상이어야 합니다.')
    return
  }
  saving.value = true
  await new Promise((r) => setTimeout(r, 300))
  saving.value = false
  password.value = { current: '', next: '', confirm: '' }
  savedMsg.value = '비밀번호가 변경되었습니다.'
  setTimeout(() => (savedMsg.value = ''), 2000)
}

function logout() {
  if (!confirm('로그아웃 하시겠습니까?')) return
  router.push('/login')
}

function deleteAccount() {
  if (
    !confirm(
      '정말 계정을 삭제하시겠습니까?\n삭제된 계정과 데이터는 복구할 수 없습니다.',
    )
  )
    return
  alert('계정 삭제 요청이 접수되었습니다.')
  router.push('/login')
}
</script>

<template>
  <div class="settings">
    <header class="page-head">
      <h1>설정</h1>
      <p class="sub">프로필과 알림, 계정 정보를 관리합니다.</p>
    </header>

    <transition name="fade">
      <div v-if="savedMsg" class="saved-toast">{{ savedMsg }}</div>
    </transition>

    <section class="card">
      <h2>프로필</h2>
      <div class="avatar-row">
        <img :src="profile.avatar" alt="avatar" />
        <button class="secondary-btn" type="button">이미지 변경</button>
      </div>

      <div class="field">
        <label for="display">표시 이름</label>
        <input id="display" v-model="profile.displayName" type="text" />
      </div>

      <div class="field">
        <label for="bio">소개</label>
        <textarea id="bio" v-model="profile.bio" rows="3" />
      </div>

      <div class="actions">
        <button class="primary-btn" :disabled="saving" @click="saveProfile">
          저장
        </button>
      </div>
    </section>

    <section class="card">
      <h2>알림</h2>
      <ul class="toggle-list">
        <li>
          <div>
            <div class="t-title">참가 신청 알림</div>
            <div class="t-sub">내 구인글에 참가 신청이 들어왔을 때</div>
          </div>
          <label class="switch">
            <input v-model="notifications.applyReceived" type="checkbox" />
            <span class="slider"></span>
          </label>
        </li>
        <li>
          <div>
            <div class="t-title">신청 수락 알림</div>
            <div class="t-sub">내 신청이 수락되거나 거절되었을 때</div>
          </div>
          <label class="switch">
            <input v-model="notifications.applyAccepted" type="checkbox" />
            <span class="slider"></span>
          </label>
        </li>
        <li>
          <div>
            <div class="t-title">댓글 알림</div>
            <div class="t-sub">내 글에 댓글이 달렸을 때</div>
          </div>
          <label class="switch">
            <input v-model="notifications.comments" type="checkbox" />
            <span class="slider"></span>
          </label>
        </li>
        <li>
          <div>
            <div class="t-title">마케팅 정보</div>
            <div class="t-sub">새 기능, 이벤트 소식 등</div>
          </div>
          <label class="switch">
            <input v-model="notifications.marketing" type="checkbox" />
            <span class="slider"></span>
          </label>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>비밀번호 변경</h2>
      <div class="field">
        <label for="cur">현재 비밀번호</label>
        <input id="cur" v-model="password.current" type="password" />
      </div>
      <div class="field">
        <label for="new">새 비밀번호</label>
        <input id="new" v-model="password.next" type="password" />
      </div>
      <div class="field">
        <label for="conf">새 비밀번호 확인</label>
        <input id="conf" v-model="password.confirm" type="password" />
      </div>
      <div class="actions">
        <button class="primary-btn" :disabled="saving" @click="changePassword">
          비밀번호 변경
        </button>
      </div>
    </section>

    <section class="card danger-zone">
      <h2>계정</h2>
      <div class="danger-row">
        <div>
          <div class="t-title">로그아웃</div>
          <div class="t-sub">이 기기에서 로그아웃합니다.</div>
        </div>
        <button class="secondary-btn" @click="logout">로그아웃</button>
      </div>
      <div class="danger-row">
        <div>
          <div class="t-title">계정 삭제</div>
          <div class="t-sub">삭제된 계정은 복구할 수 없습니다.</div>
        </div>
        <button class="danger-btn" @click="deleteAccount">계정 삭제</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-head {
  margin-bottom: 1.25rem;
}

.page-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.sub {
  font-size: 0.9rem;
  opacity: 0.75;
}

.saved-toast {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.88rem;
  margin-bottom: 1rem;
}

@media (prefers-color-scheme: dark) {
  .saved-toast {
    background: #14361f;
    color: #86efac;
    border-color: #166534;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.4rem;
  background: var(--color-background);
  margin-bottom: 1rem;
}

.card h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.avatar-row img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ddd;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
}

.field input,
.field textarea {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.92rem;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #ea580c;
}

.field textarea {
  resize: vertical;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.primary-btn {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
  color: white;
  border: none;
  padding: 0.55rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  color: var(--color-text);
  background: var(--color-background);
}

.secondary-btn:hover {
  background: rgba(234, 88, 12, 0.08);
  border-color: #ea580c;
}

.danger-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  color: #dc2626;
  background: var(--color-background);
}

.danger-btn:hover {
  background: #fef2f2;
}

@media (prefers-color-scheme: dark) {
  .danger-btn {
    border-color: #7f1d1d;
    color: #fca5a5;
  }
  .danger-btn:hover {
    background: #3f1414;
  }
}

.toggle-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toggle-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--color-border);
}

.toggle-list li:last-child {
  border-bottom: none;
}

.t-title {
  font-size: 0.92rem;
  font-weight: 500;
}

.t-sub {
  font-size: 0.78rem;
  opacity: 0.7;
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.switch input:checked + .slider {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
}

.switch input:checked + .slider::before {
  transform: translateX(18px);
}

.danger-zone {
  border-color: #fecaca;
}

@media (prefers-color-scheme: dark) {
  .danger-zone {
    border-color: #7f1d1d;
  }
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--color-border);
}

.danger-row:last-child {
  border-bottom: none;
}
</style>
