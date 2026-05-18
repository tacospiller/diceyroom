<script setup lang="ts">
import { RouterLink } from 'vue-router'

// TODO: no /account/me, /profile, or sessions endpoint on the backend yet.
// Profile card, stats, and recent sessions remain hidden until those land.
</script>

<template>
  <div class="profile">
    <header class="page-head">
      <h1>마이페이지</h1>
    </header>

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
  </div>
</template>

<style scoped>
.profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.page-head h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
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
  background: var(--color-red-soft);
  border-color: var(--color-red);
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
</style>
