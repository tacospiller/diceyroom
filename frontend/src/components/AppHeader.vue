<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { ref } from 'vue'
import searchIcon from '@/assets/icons/search.svg?raw'
import notificationsIcon from '@/assets/icons/notifications.svg?raw'

const router = useRouter()

interface NotificationItem {
  id: number
  text: string
  time: string
}

const searchQuery = ref('')
const showNotifications = ref(false)
const showProfileMenu = ref(false)

// TODO: no backend endpoint for notifications yet.
const notifications = ref<NotificationItem[]>([])

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  showProfileMenu.value = false
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value
  showNotifications.value = false
}

function navigate(to: string) {
  showProfileMenu.value = false
  router.push(to)
}
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="logo">
      <span class="logo-icon">🎲</span>
      <span class="logo-text">DiceyRoom</span>
    </RouterLink>

    <div class="search-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="시스템, 지역, 제목으로 검색..."
      />
      <button class="search-btn" aria-label="검색">
        <span class="icon" v-html="searchIcon"></span>
      </button>
    </div>

    <div class="header-actions">
      <RouterLink to="/posts/new" class="create-btn">+ 구인글 쓰기</RouterLink>

      <div class="action-wrap">
        <button
          class="icon-btn"
          aria-label="알림"
          @click="toggleNotifications"
        >
          <span class="icon" v-html="notificationsIcon"></span>
          <span v-if="notifications.length > 0" class="badge">
            {{ notifications.length }}
          </span>
        </button>
        <div v-if="showNotifications" class="dropdown notif-dropdown">
          <div class="dropdown-header">알림</div>
          <ul v-if="notifications.length > 0">
            <li v-for="n in notifications" :key="n.id">
              <div class="notif-text">{{ n.text }}</div>
              <div class="notif-time">{{ n.time }}</div>
            </li>
          </ul>
          <div v-else class="empty-notif">새 알림이 없습니다.</div>
        </div>
      </div>

      <div class="action-wrap">
        <button
          class="profile-btn"
          aria-label="프로필"
          @click="toggleProfileMenu"
        >
          <img
            src="https://api.dicebear.com/7.x/pixel-art/svg"
            alt="profile"
          />
        </button>
        <div v-if="showProfileMenu" class="dropdown profile-dropdown">
          <ul>
            <li @click="navigate('/profile')">내 프로필</li>
            <li @click="navigate('/profile/posts')">내가 쓴 글</li>
            <li @click="navigate('/profile/settings')">설정</li>
            <li class="divider" @click="navigate('/login')">로그아웃</li>
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  display: grid;
  grid-template-columns: 220px 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text);
}

.logo-icon {
  font-size: 1.4rem;
}

.search-wrapper {
  display: flex;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  overflow: hidden;
  background: var(--color-background);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.55rem 1rem;
  background: transparent;
  color: var(--color-text);
  font-size: 0.9rem;
}

.search-btn {
  border: none;
  background: transparent;
  padding: 0 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #ea580c;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.icon :deep(svg) {
  width: 24px;
  height: 24px;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  text-decoration: none;
}

.create-btn:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
}

.action-wrap {
  position: relative;
}

.icon-btn {
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--color-border);
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 999px;
  font-weight: 700;
}

.profile-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 36px;
  height: 36px;
}

.profile-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #ddd;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 240px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
}

.dropdown-header {
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.dropdown ul {
  list-style: none;
  padding: 0.25rem 0;
  margin: 0;
}

.dropdown li {
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.dropdown li:hover {
  background: rgba(234, 88, 12, 0.1);
}

.notif-text {
  font-size: 0.88rem;
}

.notif-time {
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 2px;
}

.empty-notif {
  padding: 1.25rem 1rem;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.65;
}

.divider {
  border-top: 1px solid var(--color-border);
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .site-header {
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
  }
  .logo-text {
    display: none;
  }
  .create-btn {
    padding: 0.5rem 0.7rem;
    font-size: 0.85rem;
  }
}
</style>
