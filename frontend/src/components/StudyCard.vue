<template>
  <div class="study-card" @click="$emit('click')">
    <div class="card-header">
      <div class="study-id">
        <el-tag size="small" type="info" v-if="study.nctId">
          {{ study.nctId }}
        </el-tag>
      </div>
      <div class="favorite-btn" @click.stop="toggleFavorite">
        <el-icon :class="{ 'is-favorited': isFavorited }">
          <StarFilled v-if="isFavorited" />
          <Star v-else />
        </el-icon>
      </div>
    </div>

    <div class="study-title">
      <h3 :title="study.briefTitle || study.officialTitle">
        {{ truncateText(study.briefTitle || study.officialTitle || '未命名研究', 80) }}
      </h3>
    </div>

    <div class="study-status">
      <el-tag
        :type="getStatusType(study.overallStatus)"
        size="small"
        class="status-tag"
      >
        {{ getStatusLabel(study.overallStatus) }}
      </el-tag>
      <el-tag
        v-if="study.phase"
        size="small"
        type="info"
        class="phase-tag"
      >
        {{ study.phase }}
      </el-tag>
      <el-tag
        v-if="study.studyType"
        size="small"
        type="info"
        class="type-tag"
      >
        {{ getStudyTypeLabel(study.studyType) }}
      </el-tag>
    </div>

    <div class="study-info">
      <div class="info-item" v-if="study.sponsors && study.sponsors.length > 0">
        <span class="label">申办方：</span>
        <span class="value">
          {{ getLeadSponsor(study.sponsors) }}
        </span>
      </div>

      <div class="info-item" v-if="study.conditions && study.conditions.length > 0">
        <span class="label">适应症：</span>
        <span class="value">
          {{ study.conditions.slice(0, 3).join('、') }}
          <span v-if="study.conditions.length > 3"> 等</span>
        </span>
      </div>

      <div class="info-item" v-if="study.interventions && study.interventions.length > 0">
        <span class="label">干预措施：</span>
        <span class="value">
          {{ study.interventions.slice(0, 2).join('、') }}
          <span v-if="study.interventions.length > 2"> 等</span>
        </span>
      </div>
    </div>

    <div class="study-dates" v-if="study.startDate || study.completionDate">
      <div class="date-item" v-if="study.startDate">
        <span class="label">开始日期：</span>
        <span class="value">{{ formatDate(study.startDate) }}</span>
      </div>
      <div class="date-item" v-if="study.completionDate">
        <span class="label">完成日期：</span>
        <span class="value">{{ formatDate(study.completionDate) }}</span>
      </div>
    </div>

    <div class="study-stats" v-if="study.enrollment">
      <div class="stat-item">
        <el-icon><User /></el-icon>
        <span>目标入组：{{ study.enrollment }}例</span>
      </div>
    </div>

    <div class="card-actions">
      <el-button type="primary" size="small" @click.stop="viewDetails">
        查看详情
      </el-button>
      <el-button size="small" @click.stop="viewRelatedDrugs">
        相关药物
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, StarFilled, User } from '@element-plus/icons-vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { formatDate, truncateText } from '@/utils'
import type { Study, StudySponsor } from '@/types'
import { ElMessage } from 'element-plus'

interface Props {
  study: Study
}

interface Emits {
  (e: 'click'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const router = useRouter()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()

// 计算属性
const isFavorited = computed(() => {
  return favoritesStore.isItemFavorited('study', props.study.id)
})

// 方法
const getStatusType = (status?: string): any => {
  const typeMap: Record<string, any> = {
    'Recruiting': 'success',
    'Active, not recruiting': 'warning',
    'Completed': 'info',
    'Terminated': 'danger',
    'Suspended': 'danger',
    'Withdrawn': 'danger',
  }
  return typeMap[status || ''] || 'info'
}

const getStatusLabel = (status?: string): string => {
  const labelMap: Record<string, string> = {
    'Recruiting': '招募中',
    'Active, not recruiting': '进行中',
    'Completed': '已完成',
    'Terminated': '已终止',
    'Suspended': '已暂停',
    'Withdrawn': '已撤回',
    'Not yet recruiting': '尚未招募',
  }
  return labelMap[status || ''] || status || '未知状态'
}

const getStudyTypeLabel = (type?: string): string => {
  const labelMap: Record<string, string> = {
    'Interventional': '干预性',
    'Observational': '观察性',
    'Expanded Access': '扩展访问',
  }
  return labelMap[type || ''] || type || '未知类型'
}

const getLeadSponsor = (sponsors: StudySponsor[]): string => {
  const leadSponsor = sponsors.find(s => s.leadSponsor)
  return leadSponsor ? leadSponsor.sponsorName : (sponsors[0]?.sponsorName || '未知')
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录后再收藏')
    return
  }

  const result = await favoritesStore.toggleFavorite('study', props.study.id)
  if (result.success) {
    ElMessage.success(isFavorited.value ? '已取消收藏' : '收藏成功')
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const viewDetails = () => {
  router.push(`/study/${props.study.id}`)
}

const viewRelatedDrugs = () => {
  // 根据研究中的干预措施搜索相关药物
  const keyword = props.study.interventions?.[0] || ''
  router.push(`/drugs?search=${encodeURIComponent(keyword)}`)
}
</script>

<style scoped lang="scss">
.study-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #1e3a8a;
    box-shadow: 0 8px 24px rgba(30, 58, 138, 0.15);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .study-id {
      :deep(.el-tag) {
        font-size: 12px;
        font-family: monospace;
      }
    }

    .favorite-btn {
      flex-shrink: 0;
      margin-left: 12px;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        background: #f3f4f6;
      }

      .el-icon {
        font-size: 20px;
        color: #d1d5db;
        transition: color 0.3s ease;

        &.is-favorited {
          color: #f59e0b;
        }
      }
    }
  }

  .study-title {
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .study-status {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .status-tag {
      font-weight: 500;
    }

    .phase-tag,
    .type-tag {
      opacity: 0.8;
    }
  }

  .study-info {
    flex: 1;
    margin-bottom: 16px;

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #6b7280;
        flex-shrink: 0;
        font-weight: 500;
      }

      .value {
        color: #374151;
        flex: 1;
      }
    }
  }

  .study-dates {
    margin-bottom: 12px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;

    .date-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;
      line-height: 1.4;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #6b7280;
      }

      .value {
        color: #374151;
        font-weight: 500;
      }
    }
  }

  .study-stats {
    margin-bottom: 16px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;

      .el-icon {
        font-size: 14px;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;

    .el-button {
      flex: 1;
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    padding: 16px;

    .study-title {
      h3 {
        font-size: 15px;
      }
    }

    .study-status {
      .el-tag {
        font-size: 11px;
        padding: 1px 6px;
      }
    }

    .card-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
