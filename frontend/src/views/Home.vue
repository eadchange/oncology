<template>
  <div class="home">
    <!-- Hero区域 -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">
            专业的抗肿瘤药物和临床研究信息平台
          </h1>
          <p class="hero-subtitle">
            汇聚全球权威数据，助力肿瘤研究与治疗
          </p>
          <div class="hero-search">
            <SearchBox
              v-model="searchKeyword"
              placeholder="搜索药物、研究或疾病..."
              size="large"
              @search="handleSearch"
            />
          </div>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/studies')">
              浏览临床研究
            </el-button>
            <el-button size="large" @click="$router.push('/drugs')">
              查看已上市药物
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据概览 -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><MedicineBox /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.drugCount || 0 }}</h3>
              <p>已批准药物</p>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.studyCount || 0 }}</h3>
              <p>临床研究</p>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.sponsorCount || 0 }}</h3>
              <p>研究机构</p>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ stats.siteCount || 0 }}</h3>
              <p>研究中心</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门药物 -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header">
          <h2>最新批准药物</h2>
          <el-button type="primary" link @click="$router.push('/drugs')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="drug-grid" v-loading="loadingDrugs">
          <DrugCard
            v-for="drug in hotDrugs"
            :key="drug.id"
            :drug="drug"
            @click="$router.push(`/drug/${drug.id}`)"
          />
        </div>
      </div>
    </section>

    <!-- 热门临床研究 -->
    <section class="featured-section">
      <div class="container">
        <div class="section-header">
          <h2>热门临床研究</h2>
          <el-button type="primary" link @click="$router.push('/studies')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="study-list" v-loading="loadingStudies">
          <StudyCard
            v-for="study in hotStudies"
            :key="study.id"
            :study="study"
            @click="$router.push(`/study/${study.id}`)"
          />
        </div>
      </div>
    </section>

    <!-- 功能介绍 -->
    <section class="features">
      <div class="container">
        <h2>平台特色</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <h3>权威数据源</h3>
            <p>
              整合FDA、NMPA、EMA等权威监管机构数据，
              以及ClinicalTrials.gov等临床试验注册平台信息。
            </p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Search /></el-icon>
            </div>
            <h3>智能搜索</h3>
            <p>
              支持多维度搜索和筛选，快速定位所需的药物和临床研究信息，
              提高工作效率。
            </p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Star /></el-icon>
            </div>
            <h3>个性化收藏</h3>
            <p>
              收藏感兴趣的药物和研究，建立个人知识库，
              随时查看最新动态和更新。
            </p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Refresh /></el-icon>
            </div>
            <h3>实时更新</h3>
            <p>
              自动抓取最新数据，确保信息的时效性和准确性，
              为临床决策提供可靠支持。
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SearchBox from '@/components/SearchBox.vue'
import DrugCard from '@/components/DrugCard.vue'
import StudyCard from '@/components/StudyCard.vue'
import { 
  MedicineBox, 
  Document, 
  OfficeBuilding, 
  Location,
  ArrowRight,
  DataAnalysis,
  Search,
  Star,
  Refresh
} from '@element-plus/icons-vue'
import { drugsAPI, studiesAPI, configAPI } from '@/utils/api'
import type { Drug, Study } from '@/types'

const router = useRouter()

// 状态
const searchKeyword = ref('')
const hotDrugs = ref<Drug[]>([])
const hotStudies = ref<Study[]>([])
const stats = ref({
  drugCount: 0,
  studyCount: 0,
  sponsorCount: 0,
  siteCount: 0,
})
const loadingDrugs = ref(false)
const loadingStudies = ref(false)

// 方法
const handleSearch = (keyword: string) => {
  if (!keyword.trim()) return
  
  // 判断搜索类型并跳转到相应页面
  if (keyword.toLowerCase().includes('nct')) {
    router.push(`/studies?search=${encodeURIComponent(keyword)}`)
  } else {
    // 默认搜索药物
    router.push(`/drugs?search=${encodeURIComponent(keyword)}`)
  }
}

const fetchHotDrugs = async () => {
  loadingDrugs.value = true
  try {
    const response = await drugsAPI.getHotDrugs(8)
    if (response.success && response.data) {
      hotDrugs.value = response.data
    }
  } catch (error) {
    console.error('获取热门药物失败:', error)
  } finally {
    loadingDrugs.value = false
  }
}

const fetchHotStudies = async () => {
  loadingStudies.value = true
  try {
    const response = await studiesAPI.getHotStudies(6)
    if (response.success && response.data) {
      hotStudies.value = response.data
    }
  } catch (error) {
    console.error('获取热门研究失败:', error)
  } finally {
    loadingStudies.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await configAPI.getStats()
    if (response.success && response.data) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchHotDrugs()
  fetchHotStudies()
  fetchStats()
})
</script>

<style scoped lang="scss">
.home {
  .hero {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: #fff;
    padding: 80px 0;
    text-align: center;

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .hero-title {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .hero-subtitle {
      font-size: 18px;
      margin-bottom: 32px;
      opacity: 0.9;
      line-height: 1.6;
    }

    .hero-search {
      max-width: 600px;
      margin: 0 auto 32px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;

      .el-button {
        padding: 12px 32px;
        font-size: 16px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.3s ease;

        &.el-button--primary {
          background: #fff;
          color: #1e3a8a;
          border-color: #fff;

          &:hover {
            background: #f8fafc;
            transform: translateY(-2px);
          }
        }

        &:not(.el-button--primary) {
          background: transparent;
          color: #fff;
          border-color: rgba(255, 255, 255, 0.5);

          &:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #fff;
            transform: translateY(-2px);
          }
        }
      }
    }
  }

  .stats {
    background: #fff;
    padding: 48px 0;
    margin-top: -40px;
    position: relative;
    z-index: 1;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
    }

    .stat-item {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }

      .stat-icon {
        font-size: 40px;
        color: #1e3a8a;
        margin-bottom: 16px;

        .el-icon {
          font-size: inherit;
        }
      }

      h3 {
        font-size: 32px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
      }

      p {
        color: #6b7280;
        font-weight: 500;
      }
    }
  }

  .featured-section {
    padding: 64px 0;
    background: #f8fafc;

    &:nth-child(even) {
      background: #fff;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;

      h2 {
        font-size: 28px;
        font-weight: 700;
        color: #1f2937;
      }

      .el-button {
        font-size: 16px;
        font-weight: 500;

        &:hover {
          .el-icon {
            transform: translateX(4px);
          }
        }

        .el-icon {
          transition: transform 0.3s ease;
        }
      }
    }

    .drug-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .study-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }
  }

  .features {
    padding: 64px 0;
    background: #fff;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    h2 {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 48px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 32px;

      .feature-item {
        text-align: center;
        padding: 32px 24px;
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          background: #f8fafc;
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 48px;
          color: #1e3a8a;
          margin-bottom: 20px;

          .el-icon {
            font-size: inherit;
          }
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        p {
          color: #6b7280;
          line-height: 1.6;
        }
      }
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    .hero {
      padding: 60px 0;

      .hero-title {
        font-size: 28px;
      }

      .hero-subtitle {
        font-size: 16px;
      }

      .hero-actions {
        flex-direction: column;
        align-items: center;

        .el-button {
          width: 200px;
        }
      }
    }

    .stats {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .stat-item {
        padding: 20px 16px;

        .stat-icon {
          font-size: 32px;
        }

        h3 {
          font-size: 24px;
        }
      }
    }

    .featured-section {
      padding: 48px 0;

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        h2 {
          font-size: 24px;
        }
      }

      .drug-grid,
      .study-list {
        grid-template-columns: 1fr;
      }
    }

    .features {
      padding: 48px 0;

      h2 {
        font-size: 24px;
        margin-bottom: 32px;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 24px;

        .feature-item {
          padding: 24px 16px;
        }
      }
    }
  }
}
</style>
