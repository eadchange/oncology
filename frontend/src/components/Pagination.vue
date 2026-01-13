<template>
  <div class="pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :background="background"
      :disabled="disabled"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @prev-click="handlePrevClick"
      @next-click="handleNextClick"
    >
      <!-- 自定义分页内容 -->
      <template v-if="showTotal" #total="{ total }">
        <span class="pagination-total">
          共 {{ total }} 条记录
          <span v-if="totalPages > 0">
            ，第 {{ currentPage }} / {{ totalPages }} 页
          </span>
        </span>
      </template>
    </el-pagination>

    <!-- 快速跳转 -->
    <div class="quick-jumper" v-if="showQuickJumper">
      <span>跳转到</span>
      <el-input-number
        v-model="jumpPage"
        :min="1"
        :max="totalPages"
        :disabled="disabled"
        size="small"
        controls-position="right"
        @change="handleJump"
      />
      <span>页</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PaginationProps } from 'element-plus'

interface Props {
  total: number
  currentPage: number
  pageSize?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
  disabled?: boolean
  showTotal?: boolean
  showQuickJumper?: boolean
  hideOnSinglePage?: boolean
}

interface Emits {
  (e: 'update:currentPage', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
  (e: 'prev-click', page: number): void
  (e: 'next-click', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  disabled: false,
  showTotal: true,
  showQuickJumper: false,
  hideOnSinglePage: false,
})

const emit = defineEmits<Emits>()

// 状态
const jumpPage = ref(1)

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

// 监听
watch(() => props.currentPage, (newVal) => {
  jumpPage.value = newVal
}, { immediate: true })

// 方法
const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('size-change', size)
  
  // 当pageSize改变时，重置到第一页
  if (props.currentPage > 1) {
    emit('update:currentPage', 1)
    emit('current-change', 1)
  }
}

const handleCurrentChange = (page: number) => {
  emit('update:currentPage', page)
  emit('current-change', page)
  jumpPage.value = page
}

const handlePrevClick = (page: number) => {
  emit('prev-click', page)
}

const handleNextClick = (page: number) => {
  emit('next-click', page)
}

const handleJump = (page: number) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('update:currentPage', page)
    emit('current-change', page)
  }
}

// 公开方法
const jumpToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page)
    emit('current-change', page)
  }
}

const jumpToFirst = () => {
  jumpToPage(1)
}

const jumpToLast = () => {
  jumpToPage(totalPages.value)
}

const jumpToPrev = () => {
  if (props.currentPage > 1) {
    jumpToPage(props.currentPage - 1)
  }
}

const jumpToNext = () => {
  if (props.currentPage < totalPages.value) {
    jumpToPage(props.currentPage + 1)
  }
}

defineExpose({
  jumpToPage,
  jumpToFirst,
  jumpToLast,
  jumpToPrev,
  jumpToNext,
})
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
  flex-wrap: wrap;

  .pagination-total {
    color: #6b7280;
    font-size: 14px;
    margin-right: 8px;
  }

  .quick-jumper {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;

    span {
      white-space: nowrap;
    }

    :deep(.el-input-number) {
      width: 80px;

      .el-input__inner {
        text-align: center;
        padding: 0 24px 0 8px;
      }
    }
  }

  // 自定义分页样式
  :deep(.el-pagination) {
    .el-pager li {
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        color: #1e3a8a;
      }

      &.active {
        background: #1e3a8a;
        border-color: #1e3a8a;
      }
    }

    .btn-prev,
    .btn-next {
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        color: #1e3a8a;
        border-color: #1e3a8a;
      }
    }

    .el-select .el-input {
      width: 100px;
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;

    .quick-jumper {
      margin-top: 8px;
    }

    :deep(.el-pagination) {
      .el-pagination__sizes,
      .el-pagination__jumper {
        display: none;
      }
    }
  }
}
</style>
