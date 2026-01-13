<template>
  <div class="studies-page">
    <Header />
    
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>临床研究</h1>
        <p>浏览和搜索全球抗肿瘤药物临床研究信息</p>
      </div>

      <!-- 搜索和筛选区 -->
      <div class="search-filter-section">
        <el-card>
          <div class="search-box">
            <SearchBox
              v-model="searchParams.keyword"
              placeholder="搜索研究标题、NCT编号或适应症..."
              type="study"
              @search="handleSearch"
            />
          </div>

          <div class="filter-section">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>研究阶段</label>
                  <el-select
                    v-model="searchParams.filters.phase"
                    placeholder="全部阶段"
                    clearable
                    multiple
                    collapse-tags
                  >
                    <el-option label="Phase 1" value="Phase 1" />
                    <el-option label="Phase 2" value="Phase 2" />
                    <el-option label="Phase 3" value="Phase 3" />
                    <el-option label="Phase 4" value="Phase 4" />
                    <el-option label="N/A" value="N/A" />
                  </el-select>
                </div>
              </el-col>

              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>研究状态</label>
                  <el-select
                    v-model="searchParams.filters.status"
                    placeholder="全部状态"
                    clearable
                    multiple
                    collapse-tags
                  >
                    <el-option label="招募中" value="Recruiting" />
                    <el-option label="进行中" value="Active, not recruiting" />
                    <el-option label="已完成" value="Completed" />
                    <el-option label="已终止" value="Terminated" />
                    <el-option label="已暂停" value="Suspended" />
                  </el-select>
                </div>
              </el-col>

              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>研究类型</label>
                  <el-select
                    v-model="searchParams.filters.studyType"
                    placeholder="全部类型"
                    clearable
                  >
                    <el-option label="干预性研究" value="Interventional" />
                    <el-option label="观察性研究" value="Observational" />
                  </el-select>
                </div>
              </el-col>

              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>排序方式</label>
                  <el-select
                    v-model="searchParams.sort"
                    placeholder="默认排序"
                    clearable
                  >
                    <el-option label="最新更新" value="updatedAt" />
                    <el-option label="开始日期" value="startDate" />
                    <el-option label="完成日期" value="completionDate" />
                    <el-option label="入组人数" value="enrollment" />
                  </el-select>
                </div>
              </el-col>
            </el-row>

            <div class="filter-actions">
              <el-button @click="resetFilters">重置筛选</el-button>
              <el-button type="primary" @click="handleSearch">应用筛选</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-tags" v-if="hasActiveFilters">
        <el-tag
          v-for="tag in filterTags"
          :key="tag.key"
          closable
          @close="removeFilter(tag.key, tag.value)"
        >
          {{ tag.label }}: {{ tag.value }}
        </el-tag>
        <el-button link type="primary" @click="clearAllFilters">
          清除全部
        </el-button>
      </div>

      <!-- 结果统计 -->
      <div class="results-stats" v-if="!loading">
        <p>
          共找到 <strong>{{ studies.total || 0 }}</strong> 项研究
          <span v-if="searchParams.keyword">
            ，关键词 "{{ searchParams.keyword }}"
          </span>
        </p>
      </div>

      <!-- 研究列表 -->
      <div class="studies-list" v-loading="loading">
        <template v-if="studies.items && studies.items.length > 0">
          <div class="studies-grid">
            <StudyCard
              v-for="study in studies.items"
              :key="study.id"
              :study="study"
              @click="viewStudyDetail(study.id)"
            />
          </div>

          <!-- 分页 -->
          <Pagination
            v-model:currentPage="searchParams.page"
            v-model:pageSize="searchParams.size"
            :total="studies.total || 0"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </template>

        <!-- 空状态 -->
        <el-empty
          v-else-if="!loading"
          description="暂无相关研究"
          class="empty-state"
        >
          <el-button type="primary" @click="resetFilters">
            重置筛选条件
          </el-button>
        </el-empty>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import SearchBox from '@/components/SearchBox.vue'
import StudyCard from '@/components/StudyCard.vue'
import Pagination from '@/components/Pagination.vue'
import { studiesAPI } from '@/utils/api'
import type { Study, SearchParams, SearchFilters } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const studies = ref<{
  items: Study[]
  total: number
  page: number
  size: number
  totalPages: number
}>({
  items: [],
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0,
})

// 搜索参数
const searchParams = reactive<SearchParams>({
  page: 1,
  size: 20,
  keyword: '',
  filters: {
    phase: [],
    status: [],
    studyType: '',
  },
  sort: '',
  order: 'desc',
})

// 计算属性
const hasActiveFilters = computed(() => {
  return !!(
    searchParams.filters.phase?.length ||
    searchParams.filters.status?.length ||
    searchParams.filters.studyType ||
    searchParams.keyword
  )
})

const filterTags = computed(() => {
  const tags: { key: string; value: string; label: string }[] = []
  
  if (searchParams.keyword) {
    tags.push({
      key: 'keyword',
      value: searchParams.keyword,
      label: '关键词',
    })
  }
  
  if (searchParams.filters.phase?.length) {
    searchParams.filters.phase.forEach(phase => {
      tags.push({
        key: `phase-${phase}`,
        value: phase,
        label: '研究阶段',
      })
    })
  }
  
  if (searchParams.filters.status?.length) {
    searchParams.filters.status.forEach(status => {
      tags.push({
        key: `status-${status}`,
        value: getStatusLabel(status),
        label: '研究状态',
      })
    })
  }
  
  if (searchParams.filters.studyType) {
    tags.push({
      key: 'studyType',
      value: getStudyTypeLabel(searchParams.filters.studyType),
      label: '研究类型',
    })
  }
  
  return tags
})

// 方法
const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    'Recruiting': '招募中',
    'Active, not recruiting': '进行中',
    'Completed': '已完成',
    'Terminated': '已终止',
    'Suspended': '已暂停',
    'Withdrawn': '已撤回',
    'Not yet recruiting': '尚未招募',
  }
  return labelMap[status] || status
}

const getStudyTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    'Interventional': '干预性研究',
    'Observational': '观察性研究',
    'Expanded Access': '扩展访问',
  }
  return labelMap[type] || type
}

const fetchStudies = async () => {
  loading.value = true
  try {
    const response = await studiesAPI.getStudies(searchParams)
    if (response.success && response.data) {
      studies.value = response.data
    }
  } catch (error) {
    console.error('获取研究列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchParams.page = 1
  fetchStudies()
  updateURL()
}

const handlePageChange = (page: number) => {
  searchParams.page = page
  fetchStudies()
  updateURL()
  scrollToTop()
}

const handleSizeChange = (size: number) => {
  searchParams.size = size
  searchParams.page = 1
  fetchStudies()
  updateURL()
}

const resetFilters = () => {
  searchParams.keyword = ''
  searchParams.filters = {
    phase: [],
    status: [],
    studyType: '',
  }
  searchParams.sort = ''
  searchParams.order = 'desc'
  searchParams.page = 1
  
  fetchStudies()
  updateURL()
}

const clearAllFilters = () => {
  resetFilters()
}

const removeFilter = (key: string, value: string) => {
  if (key === 'keyword') {
    searchParams.keyword = ''
  } else if (key.startsWith('phase-')) {
    searchParams.filters.phase = searchParams.filters.phase?.filter(p => p !== value) || []
  } else if (key.startsWith('status-')) {
    searchParams.filters.status = searchParams.filters.status?.filter(s => getStatusLabel(s) !== value) || []
  } else if (key === 'studyType') {
    searchParams.filters.studyType = ''
  }
  
  handleSearch()
}

const viewStudyDetail = (id: number) => {
  router.push(`/study/${id}`)
}

const updateURL = () => {
  const query: Record<string, any> = {}
  
  if (searchParams.keyword) query.search = searchParams.keyword
  if (searchParams.page > 1) query.page = searchParams.page
  if (searchParams.size !== 20) query.size = searchParams.size
  if (searchParams.filters.phase?.length) query.phase = searchParams.filters.phase.join(',')
  if (searchParams.filters.status?.length) query.status = searchParams.filters.status.join(',')
  if (searchParams.filters.studyType) query.type = searchParams.filters.studyType
  if (searchParams.sort) query.sort = searchParams.sort
  
  router.replace({ query })
}

const parseURLParams = () => {
  const query = route.query
  
  if (query.search) searchParams.keyword = query.search as string
  if (query.page) searchParams.page = parseInt(query.page as string)
  if (query.size) searchParams.size = parseInt(query.size as string)
  if (query.phase) searchParams.filters.phase = (query.phase as string).split(',')
  if (query.status) searchParams.filters.status = (query.status as string).split(',')
  if (query.type) searchParams.filters.studyType = query.type as string
  if (query.sort) searchParams.sort = query.sort as string
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(() => route.query, () => {
  parseURLParams()
  fetchStudies()
}, { deep: true })

// 初始化
onMounted(() => {
  parseURLParams()
  fetchStudies()
})
</script>

<style scoped lang="scss">
.studies-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 20px;
    flex: 1;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    p {
      font-size: 16px;
      color: #6b7280;
    }
  }

  .search-filter-section {
    margin-bottom: 24px;

    .search-box {
      margin-bottom: 20px;
    }

    .filter-section {
      .filter-item {
        margin-bottom: 16px;

        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
      }

      .filter-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #f3f4f6;
      }
    }
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    align-items: center;
  }

  .results-stats {
    margin-bottom: 20px;

    p {
      color: #6b7280;
      font-size: 14px;

      strong {
        color: #1f2937;
        font-weight: 600;
      }
    }
  }

  .studies-list {
    min-height: 400px;

    .studies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .empty-state {
      padding: 60px 0;
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    .container {
      padding: 20px 16px;
    }

    .page-header {
      h1 {
        font-size: 24px;
      }
    }

    .search-filter-section {
      .filter-section {
        .filter-item {
          margin-bottom: 12px;
        }

        .filter-actions {
          margin-top: 16px;
          padding-top: 16px;
        }
      }
    }

    .studies-list {
      .studies-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  }
}
</style>
