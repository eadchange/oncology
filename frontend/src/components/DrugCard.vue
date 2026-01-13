<template>
  <div class="drug-card" @click="$emit('click')">
    <div class="card-header">
      <div class="drug-names">
        <h3 class="brand-name-cn">{{ drug.brandNameCn || drug.brandName || '未知商品名' }}</h3>
        <p class="generic-name">{{ drug.genericName || '未知通用名' }}</p>
      </div>
      <div class="favorite-btn" @click.stop="toggleFavorite">
        <el-icon :class="{ 'is-favorited': isFavorited }">
          <StarFilled v-if="isFavorited" />
          <Star v-else />
        </el-icon>
      </div>
    </div>

    <div class="drug-tags">
      <el-tag
        v-if="drug.drugClass"
        size="small"
        :type="getTagType(drug.drugClass)"
      >
        {{ drug.drugClass }}
      </el-tag>
      <el-tag
        v-if="drug.category"
        size="small"
        :type="getCategoryType(drug.category)"
      >
        {{ getCategoryLabel(drug.category) }}
      </el-tag>
    </div>

    <div class="drug-info">
      <div class="info-item" v-if="drug.company">
        <span class="label">生产企业：</span>
        <span class="value">{{ drug.company }}</span>
      </div>
      
      <div class="info-item" v-if="drug.indications && drug.indications.length > 0">
        <span class="label">适应症：</span>
        <span class="value">
          {{ drug.indications.slice(0, 3).join('、') }}
          <span v-if="drug.indications.length > 3"> 等</span>
        </span>
      </div>

      <div class="info-item" v-if="drug.approvals && drug.approvals.length > 0">
        <span class="label">批准机构：</span>
        <div class="approvals">
          <el-tag
            v-for="agency in drug.approvals.slice(0, 3)"
            :key="agency"
            size="small"
            class="approval-tag"
            :class="`agency-${agency.toLowerCase()}`"
          >
            {{ getAgencyLabel(agency) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="drug-dates" v-if="drug.fdaDate || drug.nmpaDate">
      <div class="date-item" v-if="drug.fdaDate">
        <span class="label">FDA批准：</span>
        <span class="value">{{ formatDate(drug.fdaDate) }}</span>
      </div>
      <div class="date-item" v-if="drug.nmpaDate">
        <span class="label">NMPA批准：</span>
        <span class="value">{{ formatDate(drug.nmpaDate) }}</span>
      </div>
    </div>

    <div class="card-actions">
      <el-button type="primary" size="small" @click.stop="viewDetails">
        查看详情
      </el-button>
      <el-button size="small" @click.stop="viewRelatedStudies">
        相关研究
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils'
import type { Drug } from '@/types'
import { ElMessage } from 'element-plus'

interface Props {
  drug: Drug
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
  return favoritesStore.isItemFavorited('drug', props.drug.id)
})

// 方法
const getTagType = (drugClass: string): any => {
  const typeMap: Record<string, any> = {
    '化疗药物': 'danger',
    '靶向治疗': 'primary',
    '免疫治疗': 'success',
    '激素治疗': 'warning',
  }
  return typeMap[drugClass] || 'info'
}

const getCategoryType = (category: string): any => {
  const typeMap: Record<string, any> = {
    'chemotherapy': 'danger',
    'targeted': 'primary',
    'immunotherapy': 'success',
    'hormone': 'warning',
  }
  return typeMap[category] || 'info'
}

const getCategoryLabel = (category: string): string => {
  const labelMap: Record<string, string> = {
    'chemotherapy': '化疗',
    'targeted': '靶向',
    'immunotherapy': '免疫',
    'hormone': '激素',
  }
  return labelMap[category] || category
}

const getAgencyLabel = (agency: string): string => {
  const labelMap: Record<string, string> = {
    'fda': 'FDA',
    'nmpa': 'NMPA',
    'ema': 'EMA',
    'pmda': 'PMDA',
    'kfda': 'KFDA',
  }
  return labelMap[agency.toLowerCase()] || agency
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录后再收藏')
    return
  }

  const result = await favoritesStore.toggleFavorite('drug', props.drug.id)
  if (result.success) {
    ElMessage.success(isFavorited.value ? '已取消收藏' : '收藏成功')
  } else {
    ElMessage.error(result.message || '操作失败')
  }
}

const viewDetails = () => {
  router.push(`/drug/${props.drug.id}`)
}

const viewRelatedStudies = () => {
  router.push(`/studies?drug=${encodeURIComponent(props.drug.genericName || '')}`)
}
</script>

<style scoped lang="scss">
.drug-card {
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
    margin-bottom: 16px;

    .drug-names {
      flex: 1;

      .brand-name-cn {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px 0;
        line-height: 1.4;
      }

      .generic-name {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
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

  .drug-tags {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    :deep(.el-tag) {
      font-size: 12px;
      padding: 2px 8px;
    }
  }

  .drug-info {
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

      .approvals {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;

        .approval-tag {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 3px;

          &.agency-fda {
            background: #dbeafe;
            color: #1e40af;
            border-color: #93c5fd;
          }

          &.agency-nmpa {
            background: #dcfce7;
            color: #166534;
            border-color: #86efac;
          }

          &.agency-ema {
            background: #fef3c7;
            color: #92400e;
            border-color: #fcd34d;
          }

          &.agency-pmda,
          &.agency-kfda {
            background: #f3e8ff;
            color: #7c3aed;
            border-color: #c4b5fd;
          }
        }
      }
    }
  }

  .drug-dates {
    margin-bottom: 16px;
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

    .card-header {
      .drug-names {
        .brand-name-cn {
          font-size: 16px;
        }
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
