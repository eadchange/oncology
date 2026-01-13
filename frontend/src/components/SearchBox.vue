<template>
  <div class="search-box">
    <el-input
      v-model="keyword"
      :placeholder="placeholder"
      :size="size"
      @input="handleInput"
      @keyup.enter="handleSearch"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #suffix>
        <el-button
          type="primary"
          :size="size"
          @click="handleSearch"
          :loading="isLoading"
        >
          搜索
        </el-button>
      </template>
    </el-input>

    <!-- 搜索建议 -->
    <div class="search-suggestions" v-if="showSuggestions && suggestions.length > 0">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="suggestion-item"
        @click="selectSuggestion(suggestion)"
        @mouseenter="hoveredIndex = index"
        :class="{ 'is-hovered': hoveredIndex === index }"
      >
        <el-icon><Search /></el-icon>
        <span v-html="highlightSuggestion(suggestion)"></span>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div class="search-history" v-if="showHistory && searchHistory.length > 0">
      <div class="history-header">
        <span>搜索历史</span>
        <el-button link type="primary" size="small" @click="clearHistory">
          清空
        </el-button>
      </div>
      <div
        v-for="(history, index) in searchHistory"
        :key="index"
        class="history-item"
        @click="selectHistory(history)"
      >
        <el-icon><Clock /></el-icon>
        <span>{{ history }}</span>
        <el-icon
          class="delete-btn"
          @click.stop="removeHistory(history)"
        >
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Clock, Close } from '@element-plus/icons-vue'
import { searchAPI } from '@/utils/api'
import { storage, debounceFn } from '@/utils'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue?: string
  placeholder?: string
  size?: 'large' | 'default' | 'small'
  type?: 'drug' | 'study' | 'all'
  showHistory?: boolean
  maxHistory?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
  (e: 'input', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索药物、研究或疾病...',
  size: 'default',
  type: 'all',
  showHistory: true,
  maxHistory: 10,
})

const emit = defineEmits<Emits>()

const keyword = ref(props.modelValue || '')
const isLoading = ref(false)
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)
const showHistory = ref(false)
const hoveredIndex = ref(-1)
const isFocused = ref(false)

// 搜索历史
const searchHistory = ref<string[]>([])

// 计算属性
const searchHistoryKey = computed(() => `search_history_${props.type}`)

// 方法
const loadSearchHistory = () => {
  if (props.showHistory) {
    const history = storage.get(searchHistoryKey.value, [])
    searchHistory.value = history.slice(0, props.maxHistory)
  }
}

const saveSearchHistory = (term: string) => {
  if (!props.showHistory || !term.trim()) return

  let history = storage.get(searchHistoryKey.value, [])
  // 移除已存在的相同搜索词
  history = history.filter((item: string) => item !== term)
  // 添加到开头
  history.unshift(term)
  // 限制数量
  history = history.slice(0, props.maxHistory)
  
  storage.set(searchHistoryKey.value, history)
  searchHistory.value = history
}

const clearHistory = () => {
  storage.remove(searchHistoryKey.value)
  searchHistory.value = []
  ElMessage.success('已清空搜索历史')
}

const removeHistory = (term: string) => {
  let history = storage.get(searchHistoryKey.value, [])
  history = history.filter((item: string) => item !== term)
  storage.set(searchHistoryKey.value, history)
  searchHistory.value = history
}

const handleInput = (value: string) => {
  keyword.value = value
  emit('update:modelValue', value)
  emit('input', value)
  
  if (value.trim()) {
    debounceFetchSuggestions(value)
  } else {
    suggestions.value = []
    showSuggestions.value = false
  }
}

const debounceFetchSuggestions = debounceFn(async (value: string) => {
  if (!value.trim()) return

  try {
    isLoading.value = true
    const response = await searchAPI.getSuggestions(value, props.type === 'all' ? undefined : props.type)
    if (response.success && response.data) {
      suggestions.value = response.data
      showSuggestions.value = response.data.length > 0
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
  } finally {
    isLoading.value = false
  }
}, 300)

const handleSearch = () => {
  const term = keyword.value.trim()
  if (!term) return

  // 保存搜索历史
  saveSearchHistory(term)
  
  // 隐藏建议和历史
  showSuggestions.value = false
  showHistory.value = false
  
  // 触发搜索事件
  emit('search', term)
}

const handleFocus = () => {
  isFocused.value = true
  loadSearchHistory()
  
  if (!keyword.value.trim() && searchHistory.value.length > 0) {
    showHistory.value = true
    showSuggestions.value = false
  } else if (keyword.value.trim() && suggestions.value.length > 0) {
    showSuggestions.value = true
    showHistory.value = false
  }
  
  emit('focus')
}

const handleBlur = () => {
  // 延迟隐藏，以便用户可以点击建议
  setTimeout(() => {
    isFocused.value = false
    showSuggestions.value = false
    showHistory.value = false
  }, 200)
  
  emit('blur')
}

const selectSuggestion = (suggestion: string) => {
  keyword.value = suggestion
  emit('update:modelValue', suggestion)
  showSuggestions.value = false
  showHistory.value = false
  handleSearch()
}

const selectHistory = (history: string) => {
  keyword.value = history
  emit('update:modelValue', history)
  showSuggestions.value = false
  showHistory.value = false
  handleSearch()
}

const highlightSuggestion = (suggestion: string) => {
  if (!keyword.value.trim()) return suggestion
  
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return suggestion.replace(regex, '<mark>$1</mark>')
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.search-box')) {
    showSuggestions.value = false
    showHistory.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 初始化
loadSearchHistory()
</script>

<style scoped lang="scss">
.search-box {
  position: relative;
  width: 100%;

  :deep(.el-input) {
    .el-input__inner {
      padding-right: 80px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      transition: all 0.3s ease;

      &:focus {
        border-color: #1e3a8a;
        box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
      }
    }

    .el-input__suffix {
      right: 4px;
      
      .el-button {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
      }
    }
  }

  .search-suggestions,
  .search-history {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    margin-top: 4px;
  }

  .suggestion-item,
  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 14px;
    line-height: 1.5;

    &:hover,
    &.is-hovered {
      background: #f3f4f6;
    }

    .el-icon {
      color: #9ca3af;
      font-size: 16px;
      flex-shrink: 0;
    }

    mark {
      background: #fef3c7;
      color: #1f2937;
      font-weight: 500;
    }
  }

  .history-item {
    justify-content: space-between;

    span {
      flex: 1;
      color: #374151;
    }

    .delete-btn {
      opacity: 0;
      transition: opacity 0.2s ease;
      color: #9ca3af;

      &:hover {
        color: #ef4444;
      }
    }

    &:hover .delete-btn {
      opacity: 1;
    }
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 12px;
    color: #6b7280;

    .el-button {
      padding: 2px 8px;
      font-size: 12px;
    }
  }
}
</style>
