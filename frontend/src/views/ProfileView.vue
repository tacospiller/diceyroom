<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

interface Profile {
  username: string
  displayName: string
  avatar: string
  bio: string
  joinedAt: string
  stats: {
    posts: number
    sessions: number
    rating: number
  }
}

const profile = ref<Profile>({
  username: 'Keeper_Min',
  displayName: 'Min',
  avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Min',
  bio: 'Call of Cthulhu 7e 키퍼. 입문자에게 친절한 진행을 지향합니다.',
  joinedAt: '2025-11-12',
  stats: { posts: 12, sessions: 38, rating: 4.8 },
})

const recentSessions = ref([
  { id: 's1', title: '지붕 위의 그림자', role: 'Keeper', date: '2026-05-04' },
  { id: 's2', title: '잊혀진 왕국 #12', role: 'Player', date: '2026-04-28' },
  { id: 's3', title: '갱단 빌딩 단편', role: 'Player', date: '2026-04-19' },
])
</script>

<template>
  <div class="profile">
    <section class="profile-card">
      <img :src="profile.avatar" :alt="profile.displayName" class="avatar" />
      <div class="info">
        <h1>{{ profile.displayName }}</h1>
        <div class="username">@{{ profile.username }}</div>
        <p class="bio">{{ profile.bio }}</p>
        <div class="joined">가입일: {{ profile.joinedAt }}</div>
      </div>

      <div class="stats">
        <div>
          <div class="stat-num">{{ profile.stats.posts }}</div>
          <div class="stat-label">구인글</div>
        </div>
        <div>
          <div class="stat-num">{{ profile.stats.sessions }}</div>
          <div class="stat-label">세션</div>
        </div>
        <div>
          <div class="stat-num">★ {{ profile.stats.rating.toFixed(1) }}</div>
          <div class="stat-label">평점</div>
        </div>
      </div>
    </section>

    <nav class="quick-links">
      <RouterLink to="/profile/posts" class="quick-link">
        <span class="ql-icon">📝</span>
        <div>
          <div class="ql-title">내가 쓴 글</div>
          <div class="ql-sub">작성한 구인글을 관리합니다</div>
        </div>
      </RouterLink>

      <RouterLink to="/profile/settings" class="quick-link">
        <span class="ql-icon">⚙️</span>
        <div>
          <div class="ql-title">설정</div>
          <div class="ql-sub">프로필, 알림, 계정 설정</div>
        </div>
      </RouterLink>
    </nav>

    <section class="recent">
      <h2>최근 세션</h2>
      <ul class="session-list">
        <li v-for="s in recentSessions" :key="s.id">
          <span class="role-pill" :class="s.role.toLowerCase()">{{ s.role }}</span>
          <span class="session-title">{{ s.title }}</span>
          <span class="session-date">{{ s.date }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.profile-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #ddd;
}

.info h1 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.1rem;
}

.username {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.bio {
  font-size: 0.9rem;
  line-height: 1.55;
  margin-bottom: 0.5rem;
}

.joined {
  font-size: 0.78rem;
  opacity: 0.6;
}

.stats {
  display: flex;
  gap: 1.5rem;
  text-align: center;
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ea580c;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 2px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text);
}

.quick-link:hover {
  background: rgba(234, 88, 12, 0.06);
  border-color: #ea580c;
}

.ql-icon {
  font-size: 1.5rem;
}

.ql-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.ql-sub {
  font-size: 0.78rem;
  opacity: 0.7;
  margin-top: 2px;
}

.recent h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.session-list li {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--color-border);
}

.session-list li:last-child {
  border-bottom: none;
}

.session-list li:hover {
  background: rgba(234, 88, 12, 0.04);
}

.session-title {
  font-weight: 500;
}

.session-date {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  font-size: 0.82rem;
}

.role-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
}

.role-pill.keeper {
  background: #ffedd5;
  color: #c2410c;
}

.role-pill.player {
  background: #e0e7ff;
  color: #4338ca;
}

@media (max-width: 640px) {
  .profile-card {
    grid-template-columns: auto 1fr;
  }
  .stats {
    grid-column: 1 / -1;
    justify-content: space-around;
  }
}
</style>
