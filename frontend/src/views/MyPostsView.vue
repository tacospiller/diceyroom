<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listPosts, type PostListEntry } from '@/api/posts'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

type Status = 'recruiting' | 'closed' | 'done'

interface MyPost extends PostListEntry {
  status: Status
}

const filter = ref<'all' | Status>('all')
const loading = ref(true)
const errorMsg = ref('')
const myPosts = ref<MyPost[]>([])

const STATUS_LABEL: Record<Status, string> = {
  recruiting: '모집 중',
  closed: '모집 마감',
  done: '세션 종료',
}

function deriveStatus(p: PostListEntry): Status {
  const now = Date.now()
  const recruitEnd = new Date(p.recruitEndDate).getTime()
  const session = new Date(p.sessionDate).getTime()
  if (!Number.isNaN(session) && session < now) return 'done'
  if (!Number.isNaN(recruitEnd) && recruitEnd < now) return 'closed'
  return 'recruiting'
}

function fmtDate(s: string): string {
  if (!s) return undefined
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

function titleFrom(_: PostListEntry): string {
  // PostListEntry doesn't include description — fall back to rule + key.
  // The full title (embedded in description) is only available on the detail page.
  return ''
}

onMounted(async () => {
  try {
    const list = await listPosts({ authorId: userStore.session.userid })
    myPosts.value = list.map((p) => ({ ...p, status: deriveStatus(p) }))
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      errorMsg.value = '로그인이 필요합니다.'
    } else {
      errorMsg.value = '구인글 목록을 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  if (filter.value === 'all') return myPosts.value
  return myPosts.value.filter((p) => p.status === filter.value)
})

const counts = computed(() => ({
  all: myPosts.value.length,
  recruiting: myPosts.value.filter((p) => p.status === 'recruiting').length,
  closed: myPosts.value.filter((p) => p.status === 'closed').length,
  done: myPosts.value.filter((p) => p.status === 'done').length,
}))

function remove(_id: string) {
  // TODO: backend has no delete endpoint yet.
  alert('삭제 기능은 준비 중입니다.')
}
</script>

<template>
  <div class="my-posts">
    <header class="page-head">
      <div>
        <h1>내가 쓴 글</h1>
        <p class="sub">작성한 구인글을 확인하고 관리하세요.</p>
      </div>
      <RouterLink to="/posts/new" class="primary-btn">+ 새 구인글</RouterLink>
    </header>

    <div class="tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
        전체 ({{ counts.all }})
      </button>
      <button
        :class="{ active: filter === 'recruiting' }"
        @click="filter = 'recruiting'"
      >
        모집 중 ({{ counts.recruiting }})
      </button>
      <button :class="{ active: filter === 'closed' }" @click="filter = 'closed'">
        모집 마감 ({{ counts.closed }})
      </button>
      <button :class="{ active: filter === 'done' }" @click="filter = 'done'">
        세션 종료 ({{ counts.done }})
      </button>
    </div>

    <div v-if="loading" class="empty">불러오는 중...</div>

    <div v-else-if="errorMsg" class="empty error">{{ errorMsg }}</div>

    <div v-else-if="filtered.length === 0" class="empty">
      작성한 구인글이 없습니다.
    </div>

    <ul v-else class="post-list">
      <li v-for="p in filtered" :key="p.key">
        <div class="row1">
          <span class="status-pill" :class="p.status">
            {{ STATUS_LABEL[p.status] }}
          </span>
          <RouterLink :to="`/posts/${p.key}`" class="title">
            [{{ p.rule }}] {{ titleFrom(p) || '구인글 보기' }}
          </RouterLink>
        </div>
        <div class="row2">
          <span>{{ p.rule }}</span>
          <span class="dot">·</span>
          <span>세션 {{ fmtDate(p.sessionDate) ?? "미정" }}</span>
          <span class="dot">·</span>
          <span>마감 {{ fmtDate(p.recruitEndDate) ?? "미정" }}</span>
        </div>
        <div class="row3">
          <RouterLink :to="`/posts/${p.key}/edit`" class="link-btn">수정</RouterLink>
          <button class="link-btn danger" @click="remove(p.key)">삭제</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.my-posts {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
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

.primary-btn {
  background: var(--color-red);
  color: var(--color-text);
  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.primary-btn:hover {
  background: var(--color-red-hover);
}

.tabs {
  display: flex;
  gap: 0.4rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
  overflow-x: auto;
}

.tabs button {
  background: transparent;
  border: none;
  padding: 0.6rem 0.9rem;
  font-size: 0.88rem;
  cursor: pointer;
  color: var(--color-text);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
}

.tabs button:hover {
  color: var(--color-red);
}

.tabs button.active {
  border-bottom-color: var(--color-red);
  color: var(--color-red);
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.7;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
}

.empty.error {
  color: var(--color-red);
  border-color: rgba(255, 56, 49, 0.35);
  background: var(--color-red-soft);
  opacity: 1;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.post-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'r1 r3'
    'r2 r3';
  gap: 0.3rem 1rem;
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
}

.post-list li:hover {
  border-color: var(--color-red);
}

.row1 {
  grid-area: r1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.row2 {
  grid-area: r2;
  font-size: 0.82rem;
  opacity: 0.75;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.row3 {
  grid-area: r3;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  opacity: 0.5;
}

.title {
  color: var(--color-text);
  font-weight: 500;
}

.title:hover {
  color: var(--color-red);
  text-decoration: underline;
}

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pill.recruiting {
  background: rgba(134, 239, 172, 0.12);
  color: #86efac;
}

.status-pill.closed {
  background: rgba(252, 211, 77, 0.12);
  color: #fcd34d;
}

.status-pill.done {
  background: rgba(255, 253, 219, 0.08);
  color: var(--color-text-muted);
}

.link-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}

.link-btn:hover {
  background: var(--color-red-soft);
  border-color: var(--color-red);
}

.link-btn.danger:hover {
  background: var(--color-red-soft);
  border-color: var(--color-red);
  color: var(--color-red);
}
</style>
