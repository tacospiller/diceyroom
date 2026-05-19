import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMetaValues, type RuleEntry } from '@/api/meta'

export const useMetaStore = defineStore('meta', () => {
  const rules = ref<RuleEntry[]>([])

  async function fetch() {
    try {
      const data = await getMetaValues()
      rules.value = data.rules ?? []
    } catch {
      // meta 로드 실패는 조용히 무시
    }
  }

  return { rules, fetch }
})
