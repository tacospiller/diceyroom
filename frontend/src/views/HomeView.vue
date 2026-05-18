<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

type Mode = 'text' | 'voice' | 'offline' | 'other'

interface Post {
  id: number
  title: string
  rule: string
  mode: Mode
  members: { current: number; max: number }
  author: string
  recruitDeadline: string
}

const posts: Post[] = [
  {
    id: 1,
    title: '[크툴루의 부름] 초보자 환영, 시나리오 "지붕 위의 그림자"',
    rule: 'Call of Cthulhu 7e',
    mode: 'voice',
    members: { current: 2, max: 4 },
    author: 'Keeper_Min',
    recruitDeadline: '2026-05-25',
  },
  {
    id: 2,
    title: 'D&D 5e 장기 캠페인 - "잊혀진 왕국"',
    rule: 'D&D 5e',
    mode: 'offline',
    members: { current: 4, max: 5 },
    author: 'DM_Aria',
    recruitDeadline: '2026-05-30',
  },
  {
    id: 3,
    title: '패스파인더 2e 원샷 모집합니다',
    rule: 'Pathfinder 2e',
    mode: 'text',
    members: { current: 5, max: 5 },
    author: 'GoblinSlayer',
    recruitDeadline: '2026-05-19',
  },
  {
    id: 4,
    title: '[루머] 사이버펑크 레드 누아르 캠페인',
    rule: 'Cyberpunk RED',
    mode: 'offline',
    members: { current: 3, max: 6 },
    author: 'NetRunner99',
    recruitDeadline: '2026-05-28',
  },
  {
    id: 5,
    title: '월드 오브 다크니스 - 뱀파이어: 매스커레이드 V5',
    rule: 'Vampire V5',
    mode: 'voice',
    members: { current: 2, max: 5 },
    author: 'Storyteller_Lex',
    recruitDeadline: '2026-05-24',
  },
  {
    id: 6,
    title: '[입문자용] TRPG 처음이신 분 환영! D&D 원샷',
    rule: 'D&D 5e',
    mode: 'text',
    members: { current: 6, max: 6 },
    author: 'WelcomeDM',
    recruitDeadline: '2026-05-15',
  },
  {
    id: 7,
    title: '얼터너티브: 그림자 술집 시나리오',
    rule: 'Alter Ego',
    mode: 'offline',
    members: { current: 1, max: 4 },
    author: 'TaleWeaver',
    recruitDeadline: '2026-06-05',
  },
  {
    id: 8,
    title: 'Blades in the Dark 단편 캠페인 - 갱단 빌딩',
    rule: 'Blades in the Dark',
    mode: 'other',
    members: { current: 3, max: 4 },
    author: 'DoskvolGM',
    recruitDeadline: '2026-05-26',
  },
]

const sortBy = ref<'latest' | 'popular'>('latest')

const MODE_LABEL: Record<Mode, string> = {
  text: '텍스트',
  voice: '보이스',
  offline: '오프라인',
  other: '기타',
}
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

      <div class="table-wrap">
        <table class="post-table">
          <thead>
            <tr>
              <th class="col-mode">진행 방식</th>
              <th class="col-title">제목</th>
              <th class="col-rule">룰</th>
              <th class="col-members">인원</th>
              <th class="col-author">작성자</th>
              <th class="col-date">모집 마감</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id">
              <td>
                <span class="mode-pill" :class="post.mode">
                  {{ MODE_LABEL[post.mode] }}
                </span>
              </td>
              <td class="title-cell">
                <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
              </td>
              <td>{{ post.rule }}</td>
              <td class="members-cell">
                <span
                  :class="{
                    full: post.members.current >= post.members.max,
                  }"
                >
                  {{ post.members.current }} / {{ post.members.max }}
                </span>
              </td>
              <td>{{ post.author }}</td>
              <td class="date-cell">{{ post.recruitDeadline }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button>‹</button>
        <button class="active">1</button>
        <button>2</button>
        <button>3</button>
        <button>›</button>
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
  background: linear-gradient(135deg, #fef2f2 0%, #fff7ed 50%, #fefce8 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.hero h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #b91c1c;
  margin-bottom: 0.4rem;
}

.hero p {
  color: #c2410c;
  font-size: 0.95rem;
}

@media (prefers-color-scheme: dark) {
  .hero {
    background: linear-gradient(135deg, #3f1414 0%, #3a1f0a 50%, #3a2f0a 100%);
  }
  .hero h1 {
    color: #fca5a5;
  }
  .hero p {
    color: #fdba74;
  }
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
  background: rgba(234, 88, 12, 0.06);
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
  background: rgba(234, 88, 12, 0.05);
}

.col-mode {
  width: 96px;
}

.col-rule {
  width: 160px;
}

.col-members {
  width: 80px;
  text-align: center;
}

.col-author {
  width: 130px;
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
  color: #dc2626;
  text-decoration: underline;
}

.mode-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
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

.members-cell {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.members-cell .full {
  color: #9ca3af;
}

.date-cell {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 1.25rem;
}

.pagination button {
  min-width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.pagination button:hover {
  background: rgba(234, 88, 12, 0.1);
}

.pagination button.active {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
  color: white;
  border-color: #dc2626;
}
</style>
