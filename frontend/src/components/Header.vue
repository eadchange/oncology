<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <h1>抗肿瘤药物临床试验</h1>
        </router-link>

        <!-- 导航菜单 -->
        <nav class="nav-menu" :class="{ 'is-open': isMenuOpen }">
          <router-link to="/" class="nav-item" @click="closeMenu">首页</router-link>
          <router-link to="/studies" class="nav-item" @click="closeMenu">临床研究</router-link>
          <router-link to="/drugs" class="nav-item" @click="closeMenu">已上市药物</router-link>
          <router-link to="/help" class="nav-item" @click="closeMenu">帮助中心</router-link>
        </nav>

        <!-- 用户区域 -->
        <div class="user-area">
          <template v-if="authStore.isAuthenticated">
            <el-dropdown @command="handleUserCommand">
              <span class="user-dropdown">
                <el-avatar :size="32" :src="userAvatar">
                  {{ authStore.user?.username?.charAt(0) }}
                </el-avatar>
                <span class="username">{{ authStore.user?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="favorites" divided>
                    <el-icon><Star /></el-icon>
                    我的收藏
                  </el-dropdown-item>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-login">登录</router-link>
            <router-link to="/register" class="btn-register">注册</router-link>
          </template>

          <!-- 移动端菜单按钮 -->
          <button class="menu-toggle" @click="toggleMenu">
            <el-icon><Menu /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { 
  ArrowDown, 
  User, 
  Star, 
  SwitchButton,
  Menu
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const isMenuOpen = ref(false)

const userAvatar = computed(() => {
  // 这里可以根据用户信息返回头像URL
  return ''
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/user-center')
      break
    case 'favorites':
      router.push('/user-center?tab=favorites')
      break
    case 'logout':
      try {
        await authStore.logout()
        favoritesStore.clearFavorites()
        ElMessage.success('已退出登录')
        router.push('/')
      } catch (error) {
        ElMessage.error('退出登录失败')
      }
      break
  }
}
</script>

<style scoped lang="scss">
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  .logo {
    text-decoration: none;
    
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1e3a8a;
    }
  }

  .nav-menu {
    display: flex;
    gap: 32px;

    .nav-item {
      text-decoration: none;
      color: #374151;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        color: #1e3a8a;
        background: #f3f4f6;
      }

      &.router-link-active {
        color: #1e3a8a;
        background: #eff6ff;
      }
    }
  }

  .user-area {
    display: flex;
    align-items: center;
    gap: 16px;

    .btn-login,
    .btn-register {
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-login {
      color: #374151;
      
      &:hover {
        color: #1e3a8a;
        background: #f3f4f6;
      }
    }

    .btn-register {
      color: #fff;
      background: #1e3a8a;
      
      &:hover {
        background: #1e40af;
      }
    }

    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        background: #f3f4f6;
      }

      .username {
        font-weight: 500;
        color: #374151;
      }
    }

    .menu-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #374151;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:hover {
        background: #f3f4f6;
      }
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    .nav-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #fff;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      flex-direction: column;
      gap: 0;
      padding: 16px 0;
      display: none;

      &.is-open {
        display: flex;
      }

      .nav-item {
        padding: 12px 20px;
        border-radius: 0;

        &:hover {
          background: #f8fafc;
        }
      }
    }

    .user-area {
      .menu-toggle {
        display: block;
      }

      .btn-login,
      .btn-register {
        display: none;
      }
    }
  }
}
</style>
