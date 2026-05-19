<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

interface Option {
  id: string
  displayName: string
  alts: string[]
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.displayName.toLowerCase().includes(q) || !!o.alts.find(x => x.toLowerCase().includes(q)))
})

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  open.value = true
  activeIndex.value = -1
}

function select(option: Option) {
  emit('update:modelValue', option.displayName)
  open.value = false
  activeIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      open.value = true
      return
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && filtered.value[activeIndex.value]) {
      e.preventDefault()
      select(filtered.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    open.value = false
    activeIndex.value = -1
  }
}

function onFocus() {
  open.value = true
}

function onClickOutside(e: MouseEvent) {
  if (inputEl.value && !inputEl.value.closest('.autocomplete')?.contains(e.target as Node)) {
    open.value = false
    activeIndex.value = -1
  }
}

document.addEventListener('mousedown', onClickOutside)
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="autocomplete">
    <input
      ref="inputEl"
      :value="modelValue"
      :placeholder="placeholder"
      type="text"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @keydown="onKeydown"
    />
    <ul v-if="open && filtered.length > 0" class="dropdown" role="listbox">
      <li
        v-for="(option, i) in filtered"
        :key="option.id"
        :class="{ active: i === activeIndex }"
        role="option"
        @mousedown.prevent="select(option)"
      >
        {{ option.displayName }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.autocomplete {
  position: relative;
  width: 100%;
}

.autocomplete input {
  width: 100%;
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 220px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown li {
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.dropdown li:hover,
.dropdown li.active {
  background: var(--color-surface);
}
</style>
