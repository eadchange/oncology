<template>
  <div class="drugs-page">
    <Header />
    
    <div class="container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>已上市药物</h1>
        <p>浏览和搜索全球已批准上市的抗肿瘤药物信息</p>
      </div>

      <!-- 搜索和筛选区 -->
      <div class="search-filter-section">
        <el-card>
          <div class="search-box">
            <SearchBox
              v-model="searchParams.keyword"
              placeholder="搜索药物通用名、商品名或适应症..."
              type="drug"
              @search="handleSearch"
            />
          </div>

          <div class="filter-section">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>药物类别</label>
                  <el-select
                    v-model="searchParams.filters.category"
                    placeholder="全部类别"
                    clearable
                    multiple
                    collapse-tags
                  >
                    <el-option label="化疗药物" value="chemotherapy" />
                    <el-option label="靶向治疗" value="targeted" />
                    <el-option label="免疫治疗" value="immunotherapy" />
                    <el-option label="激素治疗" value="hormone" />
                  </el-select>
                </div>
              </el-col>

              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>批准机构</label>
                  <el-select
                    v-model="searchParams.filters.agency"
                    placeholder="全部机构"
                    clearable
                    multiple
                    collapse-tags
                  >
                    <el-option label="FDA" value="fda" />
                    <el-option label="NMPA" value="nmpa" />
                    <el-option label="EMA" value="ema" />
                    <el-option label="PMDA" value="pmda" />
                    <el-option label="KFDA" value="kfda" />
                  </el-select>
                </div>
              </el-col>

              <el-col :xs="24" :sm="12" :md="8" :lg="6">
                <div class="filter-item">
                  <label>生产企业</label>
                  <el-select
                    v-model="searchParams.filters.company"
                    placeholder="全部企业"
                    clearable
                    filterable
                  >
                    <el-option
                      v-for="company in companies"
                      :key="company"
                      :label="company"
                      :value="company"
                    />
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
                    <el-option label="批准日期" value="fdaDate" />
                    <el-option label="更新时间" value="updatedAt" />
                    <el-option label="通用名" value="genericName" />
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
          共找到 <strong>{{ drugs.total || 0 }}</strong> 种药物
          <span v-if="searchParams.keyword">
            ，关键词 "{{ searchParams.keyword }}"
          </span>
        </p>
      </div>

      <!-- 药物列表 -->
      <div class="drugs-list" v-loading="loading">
        <template v-if="drugs.items && drugs.items.length > 0">
          <div class="drugs-grid">
            <DrugCard
              v-for="drug in drugs.items"
              :key="drug.id"
              :drug="drug"
              @click="viewDrugDetail(drug.id)"
            />
          </div>

          <!-- 分页 -->
          <Pagination
            v-model:currentPage="searchParams.page"
            v-model:pageSize="searchParams.size"
            :total="drugs.total || 0"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </template>

        <!-- 空状态 -->
        <el-empty
          v-else-if="!loading"
          description="暂无相关药物"
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
import DrugCard from '@/components/DrugCard.vue'
import Pagination from '@/components/Pagination.vue'
import { drugsAPI } from '@/utils/api'
import type { Drug, SearchParams, SearchFilters } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const drugs = ref<{
  items: Drug[]
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

const companies = ref<string[]>([])

// 搜索参数
const searchParams = reactive<SearchParams>({
  page: 1,
  size: 20,
  keyword: '',
  filters: {
    category: [],
    agency: [],
    company: '',
  },
  sort: '',
  order: 'desc',
})

// 计算属性
const hasActiveFilters = computed(() => {
  return !!(
    searchParams.filters.category?.length ||
    searchParams.filters.agency?.length ||
    searchParams.filters.company ||
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
  
  if (searchParams.filters.category?.length) {
    searchParams.filters.category.forEach(category => {
      tags.push({
        key: `category-${category}`,
        value: getCategoryLabel(category),
        label: '药物类别',
      })
    })
  }
  
  if (searchParams.filters.agency?.length) {
    searchParams.filters.agency.forEach(agency => {
      tags.push({
        key: `agency-${agency}`,
        value: getAgencyLabel(agency),
        label: '批准机构',
      })
    })
  }
  
  if (searchParams.filters.company) {
    tags.push({
      key: 'company',
      value: searchParams.filters.company,
      label: '生产企业',
    })
  }
  
  return tags
})

// 方法
const getCategoryLabel = (category: string): string => {
  const labelMap: Record<string, string> = {
    'chemotherapy': '化疗药物',
    'targeted': '靶向治疗',
    'immunotherapy': '免疫治疗',
    'hormone': '激素治疗',
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
  return labelMap[agency] || agency
}

const fetchDrugs = async () => {
  loading.value = true
  try {
    const response = await drugsAPI.getDrugs(searchParams)
    if (response.success && response.data) {
      drugs.value = response.data
    }
  } catch (error) {
    console.error('获取药物列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchCompanies = async () => {
  try {
    // 这里应该调用获取企业列表的API
    // 暂时使用模拟数据
    companies.value = [
      'Merck & Co.',
      'Roche',
      'Pfizer',
      'AstraZeneca',
      'Novartis',
      'Bristol Myers Squibb',
      'Johnson & Johnson',
    ]
  } catch (error) {
    console.error('获取企业列表失败:', error)
  }
}

const handleSearch = () => {
  searchParams.page = 1
  fetchDrugs()
  updateURL()
}

const handlePageChange = (page: number) => {
  searchParams.page = page
  fetchDrugs()
  updateURL()
  scrollToTop()
}

const handleSizeChange = (size: number) => {
  searchParams.size = size
  searchParams.page = 1
  fetchDrugs()
  updateURL()
}

const resetFilters = () => {
  searchParams.keyword = ''
  searchParams.filters = {
    category: [],
    agency: [],
    company: '',
  }
  searchParams.sort = ''
  searchParams.order = 'desc'
  searchParams.page = 1
  
  fetchDrugs()
  updateURL()
}

const clearAllFilters = () => {
  resetFilters()
}

const removeFilter = (key: string, value: string) => {
  if (key === 'keyword') {
    searchParams.keyword = ''
  } else if (key.startsWith('category-')) {
    searchParams.filters.category = searchParams.filters.category?.filter(c => getCategoryLabel(c) !== value) || []
  } else if (key.startsWith('agency-')) {
    searchParams.filters.agency = searchParams.filters.agency?.filter(a => getAgencyLabel(a) !== value) || []
  } else if (key === 'company') {
    searchParams.filters.company = ''
  }
  
  handleSearch()
}

const viewDrugDetail = (id: number) => {
  router.push(`/drug/${id}`)
}

const updateURL = () => {
  const query: Record<string, any> = {}
  
  if (searchParams.keyword) query.search = searchParams.keyword
  if (searchParams.page > 1) query.page = searchParams.page
  if (searchParams.size !== 20) query.size = searchParams.size
  if (searchParams.filters.category?.length) query.category = searchParams.filters.category.join(',')
  if (searchParams.filters.agency?.length) query.agency = searchParams.filters.agency.join(',')
  if (searchParams.filters.company) query.company = searchParams.filters.company
  if (searchParams.sort) query.sort = searchParams.sort
  
  router.replace({ query })
}

const parseURLParams = () => {
  const query = route.query
  
  if (query.search) searchParams.keyword = query.search as string
  if (query.page) searchParams.page = parseInt(query.page as string)
  if (query.size) searchParams.size = parseInt(query.size as string)
  if (query.category) searchParams.filters.category = (query.category as string).split(',')
  if (query.agency) searchParams.filters.agency = (query.agency as string).split(',')
  if (query.company) searchParams.filters.company = query.company as string
  if (query.sort) searchParams.sort = query.sort as string
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
watch(() => route.query, () => {
  parseURLParams()
  fetchDrugs()
}, { deep: true })

// 初始化
onMounted(() => {
  parseURLParams()
  fetchDrugs()
  fetchCompanies()
})
</script>

<style scoped lang="scss">
.drugs-page {
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

  .drugs-list {
    min-height: 400px;

    .drugs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

    .drugs-list {
      .drugs-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
