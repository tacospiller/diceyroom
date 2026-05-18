import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface Session {
  sessionid: string,
  username: string,
  userid: string
}

const STORAGE_KEY = 'diceyroom.session'

function loadFromStorage(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const session = ref<Session | null>(loadFromStorage())
  const isLoggedIn = computed(() => session.value !== null)

  function setSession(s: Session) {
    session.value = s
  }

  function clear() {
    session.value = null
  }

  watch(
    session,
    (s) => {
      if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      else localStorage.removeItem(STORAGE_KEY)
    },
    { deep: true },
  )

  return { session, isLoggedIn, setSession, clear }
})
