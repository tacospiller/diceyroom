<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  getPost,
  PostNotFoundError,
  type PostDocument,
} from '@/api/posts'

type Mode = 'text' | 'voice' | 'offline' | 'other'

interface Comment {
  id: number
  author: string
  text: string
  createdAt: string
}

const route = useRoute()
const router = useRouter()

const post = ref<PostDocument | null>(null)
const loading = ref(true)
const errorMsg = ref('')
const newComment = ref('')

const comments = ref<Comment[]>([])

const MODE_LABEL: Record<Mode, string> = {
  text: '텍스트',
  voice: '보이스',
  offline: '오프라인',
  other: '기타',
}

// Backend PostDocument lacks title/mode/members — fall back to derived/placeholder values.
const title = computed(() => {
  if (!post.value) return ''
  const firstLine = post.value.description.split('\n')[0]?.trim()
  return firstLine && firstLine.length > 0 ? firstLine : `[${post.value.rule}] 구인글`
})
const mode = computed<Mode>(() => 'other')
const authorAvatar = computed(() =>
  post.value
    ? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(post.value.userid)}`
    : '',
)

function fmtDate(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

onMounted(async () => {
  const postid = String(route.params.postid ?? '')
  if (!postid) {
    errorMsg.value = '잘못된 접근입니다.'
    loading.value = false
    return
  }
  try {
    post.value = await getPost(postid)
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      errorMsg.value = '존재하지 않는 구인글입니다.'
    } else {
      errorMsg.value = '구인글을 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
})

function apply() {
  // TODO: apply endpoint not yet provided by backend
  alert('참가 신청이 접수되었습니다.')
}

function goBack() {
  router.back()
}

function submitComment() {
  // TODO: comments endpoint not yet provided by backend — local-only for now
  const text = newComment.value.trim()
  if (!text) return
  comments.value.push({
    id: Date.now(),
    author: 'Me',
    text,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  })
  newComment.value = ''
}
</script>

<template>
  <div class="post-detail">
    <button class="back-btn" @click="goBack">← 목록으로</button>

    <div v-if="loading" class="loading">불러오는 중...</div>

    <div v-else-if="errorMsg" class="error-box">{{ errorMsg }}</div>

    <article v-else-if="post" class="post-card">
      <header class="post-head">
        <span class="mode-pill" :class="mode">{{ MODE_LABEL[mode] }}</span>
        <h1>{{ title }}</h1>
        <div class="meta">
          <div class="author">
            <img :src="authorAvatar" alt="author" />
            <span>{{ post.userid }}</span>
          </div>
          <span class="dot">·</span>
          <span>{{ fmtDate(post.creationDate) }} 작성</span>
        </div>
      </header>

      <dl class="info-grid">
        <div>
          <dt>룰</dt>
          <dd>{{ post.rule }}</dd>
        </div>
        <div>
          <dt>세션 일정</dt>
          <dd>{{ fmtDateTime(post.sessionDate) }}</dd>
        </div>
        <div>
          <dt>모집 마감</dt>
          <dd>{{ fmtDate(post.recruitEndDate) }}</dd>
        </div>
      </dl>

      <section class="description">
        <h2>소개</h2>
        <p v-for="(line, i) in post.description.split('\n')" :key="i">
          {{ line }}
        </p>
      </section>

      <div class="actions">
        <button class="primary-btn" @click="apply">참가 신청</button>
        <RouterLink :to="`/posts/${post.key}/edit`" class="secondary-btn">
          수정
        </RouterLink>
      </div>
    </article>

    <section v-if="!loading && !errorMsg && post" class="comments">
      <h2>댓글 {{ comments.length }}</h2>

      <ul class="comment-list">
        <li v-for="c in comments" :key="c.id">
          <div class="comment-head">
            <strong>{{ c.author }}</strong>
            <span class="comment-time">{{ c.createdAt }}</span>
          </div>
          <p>{{ c.text }}</p>
        </li>
      </ul>

      <form class="comment-form" @submit.prevent="submitComment">
        <textarea
          v-model="newComment"
          placeholder="댓글을 입력하세요..."
          rows="3"
        ></textarea>
        <button type="submit" class="primary-btn">등록</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.post-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  margin-bottom: 1rem;
}

.back-btn:hover {
  color: #ea580c;
}

.loading {
  text-align: center;
  padding: 3rem 0;
  opacity: 0.6;
}

.error-box {
  text-align: center;
  padding: 2rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.9rem;
}

@media (prefers-color-scheme: dark) {
  .error-box {
    background: #3f1414;
    border-color: #7f1d1d;
    color: #fca5a5;
  }
}

.post-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.75rem;
  background: var(--color-background);
}

.post-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.6rem 0 0.75rem;
  line-height: 1.4;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.8;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.author img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ddd;
}

.dot {
  opacity: 0.5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(234, 88, 12, 0.04);
}

.info-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-grid dt {
  font-size: 0.75rem;
  opacity: 0.7;
}

.info-grid dd {
  font-size: 0.95rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.info-grid dd.full {
  color: #9ca3af;
}

.description h2,
.comments h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 1.5rem 0 0.75rem;
}

.description p {
  margin: 0.35rem 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.primary-btn {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
}

.primary-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.7;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
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
  background: rgba(234, 88, 12, 0.08);
}

.mode-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.mode-pill.text {
  background: #fef9c3;
  color: #a16207;
}
.mode-pill.voice {
  background: #ffedd5;
  color: #c2410c;
}
.mode-pill.offline {
  background: #fee2e2;
  color: #b91c1c;
}
.mode-pill.other {
  background: #f3f4f6;
  color: #6b7280;
}

.comments {
  margin-top: 2rem;
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  border-top: 1px solid var(--color-border);
}

.comment-list li {
  padding: 0.9rem 0.25rem;
  border-bottom: 1px solid var(--color-border);
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
}

.comment-time {
  opacity: 0.6;
  font-size: 0.75rem;
}

.comment-list p {
  font-size: 0.9rem;
  line-height: 1.6;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.comment-form textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  background: var(--color-background);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #ea580c;
}

.comment-form button {
  align-self: flex-end;
}
</style>
