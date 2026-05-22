<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { listPosts, type PostListEntry, type PostMode } from '@/api/posts'
import sessionTextIcon from '@/assets/icons/session-text.svg?raw'
import sessionVoiceIcon from '@/assets/icons/session-voice.svg?raw'
import sessionOfflineIcon from '@/assets/icons/session-offline.svg?raw'

const router = useRouter()

const posts = ref<PostListEntry[]>([])
const loading = ref(true)
const errorMsg = ref('')

const sortBy = ref<'latest' | 'popular'>('latest')

const MODE_LABEL: Record<PostMode, string> = {
  text: '텍스트',
  voice: '보이스',
  offline: '오프라인',
  other: '기타',
}

const MODE_ICON: Partial<Record<PostMode, string>> = {
  text: sessionTextIcon,
  voice: sessionVoiceIcon,
  offline: sessionOfflineIcon,
}

function modeClass(m: PostMode | string | undefined): PostMode {
  if (m === 'text' || m === 'voice' || m === 'offline' || m === 'other') return m
  return 'other'
}

function fmtDate(d: Date | undefined): string {
  if (!d) return '-'
  if (Number.isNaN(d.getTime())) return "-"
  return d.toISOString().slice(0, 10)
}

const sorted = computed(() => {
  if (sortBy.value === 'latest') {
    return [...posts.value].sort((a, b) => {
      const da = a.createdAt.getTime()
      const db = b.createdAt.getTime()
      return db - da
    })
  }
  // TODO: backend has no popularity metric yet — falls back to default order.
  return posts.value
})

onMounted(async () => {
  try {
    posts.value = await listPosts()
  } catch {
    errorMsg.value = '구인글 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>TRPG를 하자</h1>
      <p>TRPG 구인글을 간편하게 쓰고 검색하세요!</p>
    </section>

    <section class="board">
      <div class="board-controls">
        <div class="sort">
          <label>정렬:</label>
          <select v-model="sortBy">
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="state-msg">불러오는 중...</div>

      <div v-else-if="errorMsg" class="state-msg error">{{ errorMsg }}</div>

      <div v-else-if="sorted.length === 0" class="state-msg">
        등록된 구인글이 없습니다.
      </div>

      <div v-else class="table-wrap">
        <table class="post-table">
          <thead>
            <tr>
              <th class="col-rule">룰</th>
              <th class="col-mode">세션 방식</th>
              <th class="col-title">제목</th>
              <th class="col-date">모집 마감</th>
              <th class="col-date">작성자</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in sorted" :key="post.key" class="clickable-row" @click="router.push(`/posts/${post.key}`)">
              <td>{{ post.rule }}</td>
              <td>
                <span class="mode-pill" :class="modeClass(post.sessionMode)">
                  <span v-if="MODE_ICON[modeClass(post.sessionMode)]" v-html="MODE_ICON[modeClass(post.sessionMode)]" class="pill-icon"></span>
                  {{ MODE_LABEL[modeClass(post.sessionMode)] }}
                </span>
              </td>
              <td class="title-cell">
                <RouterLink :to="`/posts/${post.key}`">{{ post.title }}</RouterLink>
              </td>
              <td class="date-cell">{{ fmtDate(post.recruitEndsAt as Date) }}</td>
              <td class="date-cell">{{  }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.hero {
  text-align: center;
  padding: 2rem 1rem 2.5rem;

  border: 2px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.4rem;
}

.hero p {
  color: var(--color-text);
  opacity: 0.85;
  font-size: 0.95rem;
}

.board-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
}

.sort {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.sort select {
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
}

.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.7;
  border: 2px dashed var(--color-border);
  border-radius: 10px;
}

.state-msg.error {
  color: var(--color-red);
  border-color: rgba(255, 56, 49, 0.35);
  background: var(--color-red-soft);
  opacity: 1;
}

.table-wrap {
  border: 2px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}

.post-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.post-table thead {
  background: var(--color-surface);
}

.post-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.post-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.post-table tbody tr:last-child td {
  border-bottom: none;
}

.post-table tbody tr.clickable-row {
  cursor: pointer;
}

.post-table tbody tr:hover {
  background: var(--color-hover);
}

.col-rule {
  width: 160px;
}

.col-mode {
  width: 110px;
}

.col-date {
  width: 120px;
  white-space: nowrap;
}

.title-cell a {
  color: var(--color-text);
  font-weight: 500;
}

.title-cell a:hover {
  color: var(--color-red);
  text-decoration: underline;
}

.date-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  white-space: nowrap;
}

.pill-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pill-icon :deep(svg) {
  width: 13px;
  height: 13px;
  fill: currentColor;
}
</style>
