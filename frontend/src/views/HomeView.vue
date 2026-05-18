<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { listPosts, type PostListEntry, type PostMode } from '@/api/posts'

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

function modeClass(m: PostMode | string | undefined): PostMode {
  if (m === 'text' || m === 'voice' || m === 'offline' || m === 'other') return m
  return 'other'
}

function fmtDate(s: string): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toISOString().slice(0, 10)
}

const sorted = computed(() => {
  if (sortBy.value === 'latest') {
    return [...posts.value].sort((a, b) => {
      const da = new Date(a.recruitEndDate).getTime()
      const db = new Date(b.recruitEndDate).getTime()
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
      <h1>함께 할 동료를 찾아보세요</h1>
      <p>TRPG 마스터와 플레이어들이 만나는 공간, DiceyRoom</p>
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
              <th class="col-date">세션 일정</th>
              <th class="col-date">모집 마감</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in sorted" :key="post.key">
              <td>{{ post.rule }}</td>
              <td>
                <span class="mode-pill" :class="modeClass(post.mode)">
                  {{ MODE_LABEL[modeClass(post.mode)] }}
                </span>
              </td>
              <td class="title-cell">
                <RouterLink :to="`/posts/${post.key}`">{{ post.title }}</RouterLink>
              </td>
              <td class="date-cell">{{ fmtDate(post.sessionDate) }}</td>
              <td class="date-cell">{{ fmtDate(post.recruitEndDate) }}</td>
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

  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 1.75rem;
  font-weight: 700;
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
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
}

.state-msg {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.7;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
}

.state-msg.error {
  color: var(--color-red);
  border-color: rgba(255, 56, 49, 0.35);
  background: var(--color-red-soft);
  opacity: 1;
}

.table-wrap {
  border: 1px solid var(--color-border);
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

.post-table tbody tr:hover {
  background: var(--color-red-soft);
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
</style>
