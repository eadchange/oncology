<template>
  <footer class="footer">
    <div class="container">
      <!-- 主要内容 -->
      <div class="footer-content">
        <!-- 网站信息 -->
        <div class="footer-section">
          <h3>抗肿瘤药物临床试验</h3>
          <p class="description">
            专业的抗肿瘤药物和临床研究信息平台，汇聚全球权威数据，
            助力肿瘤研究与治疗，为医生和研究人员提供可靠的数据支持。
          </p>
          <div class="contact-info">
            <p v-if="siteConfig?.contactEmail">
              <el-icon><Message /></el-icon>
              {{ siteConfig.contactEmail }}
            </p>
            <p v-if="siteConfig?.contactPhone">
              <el-icon><Phone /></el-icon>
              {{ siteConfig.contactPhone }}
            </p>
          </div>
        </div>

        <!-- 数据资源 -->
        <div class="footer-section">
          <h4>数据资源</h4>
          <ul class="footer-links">
            <li>
              <a href="https://www.fda.gov" target="_blank" rel="noopener">
                FDA (美国食品药品监督管理局)
              </a>
            </li>
            <li>
              <a href="https://www.nmpa.gov.cn" target="_blank" rel="noopener">
                NMPA (国家药品监督管理局)
              </a>
            </li>
            <li>
              <a href="https://www.ema.europa.eu" target="_blank" rel="noopener">
                EMA (欧洲药品管理局)
              </a>
            </li>
            <li>
              <a href="https://clinicaltrials.gov" target="_blank" rel="noopener">
                ClinicalTrials.gov
              </a>
            </li>
            <li>
              <a href="https://www.who.int" target="_blank" rel="noopener">
                WHO (世界卫生组织)
              </a>
            </li>
          </ul>
        </div>

        <!-- 帮助支持 -->
        <div class="footer-section">
          <h4>帮助支持</h4>
          <ul class="footer-links">
            <li>
              <router-link to="/help/user-guide">使用指南</router-link>
            </li>
            <li>
              <router-link to="/help/faq">常见问题</router-link>
            </li>
            <li>
              <router-link to="/help/contact">联系我们</router-link>
            </li>
            <li>
              <router-link to="/help/feedback">意见反馈</router-link>
            </li>
            <li>
              <router-link to="/help/api">API文档</router-link>
            </li>
          </ul>
        </div>

        <!-- 法律信息 -->
        <div class="footer-section">
          <h4>法律信息</h4>
          <ul class="footer-links">
            <li>
              <router-link to="/help/disclaimer">免责声明</router-link>
            </li>
            <li>
              <router-link to="/help/privacy">隐私政策</router-link>
            </li>
            <li>
              <router-link to="/help/terms">服务条款</router-link>
            </li>
            <li>
              <router-link to="/help/copyright">版权声明</router-link>
            </li>
            <li>
              <router-link to="/help/data-policy">数据处理政策</router-link>
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="footer-bottom">
        <p class="copyright">
          © {{ currentYear }} 抗肿瘤药物临床试验. 
          <span v-if="siteConfig?.siteName">{{ siteConfig.siteName }}.</span>
          保留所有权利.
        </p>
        <p class="disclaimer">
          本网站数据仅供研究参考，请核对数据的准确性。数据均从公开发表文献抓取，
          不保证数据的准确性和完整性，不承担据此信息产生的任何不良后果。
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message, Phone } from '@element-plus/icons-vue'
import { configAPI } from '@/utils/api'
import type { SiteConfig } from '@/types'

const currentYear = ref(new Date().getFullYear())
const siteConfig = ref<SiteConfig | null>(null)

// 获取网站配置
const fetchSiteConfig = async () => {
  try {
    const response = await configAPI.getSiteConfig()
    if (response.success && response.data) {
      siteConfig.value = response.data
    }
  } catch (error) {
    console.error('获取网站配置失败:', error)
  }
}

onMounted(() => {
  fetchSiteConfig()
})
</script>

<style scoped lang="scss">
.footer {
  background: #1f2937;
  color: #d1d5db;
  padding: 48px 0 24px;
  margin-top: 80px;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-bottom: 40px;

    .footer-section {
      h3 {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      h4 {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .description {
        line-height: 1.6;
        margin-bottom: 16px;
        color: #9ca3af;
      }

      .contact-info {
        p {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #d1d5db;

          .el-icon {
            font-size: 16px;
          }
        }
      }

      .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: 8px;

          a {
            color: #d1d5db;
            text-decoration: none;
            transition: color 0.3s ease;
            line-height: 1.5;

            &:hover {
              color: #3b82f6;
            }
          }
        }
      }
    }
  }

  .footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 24px;
    text-align: center;

    .copyright {
      color: #fff;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .disclaimer {
      color: #9ca3af;
      font-size: 14px;
      line-height: 1.5;
      max-width: 800px;
      margin: 0 auto;
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
      gap: 32px;

      .footer-section {
        text-align: center;

        .contact-info {
          p {
            justify-content: center;
          }
        }
      }
    }

    .footer-bottom {
      .disclaimer {
        font-size: 12px;
      }
    }
  }
}
</style>
