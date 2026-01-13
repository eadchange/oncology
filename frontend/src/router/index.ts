import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/studies',
    name: 'Studies',
    component: () => import('@/views/Studies.vue'),
    meta: {
      title: '临床研究 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/study/:id',
    name: 'StudyDetail',
    component: () => import('@/views/StudyDetail.vue'),
    meta: {
      title: '研究详情 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/drugs',
    name: 'Drugs',
    component: () => import('@/views/Drugs.vue'),
    meta: {
      title: '已上市药物 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/drug/:id',
    name: 'DrugDetail',
    component: () => import('@/views/DrugDetail.vue'),
    meta: {
      title: '药物详情 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/user-center',
    name: 'UserCenter',
    component: () => import('@/views/UserCenter.vue'),
    meta: {
      title: '个人中心 - 抗肿瘤药物临床试验',
      requiresAuth: true,
    },
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/Help.vue'),
    meta: {
      title: '帮助中心 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/help/article/:slug',
    name: 'HelpArticle',
    component: () => import('@/views/HelpArticle.vue'),
    meta: {
      title: '帮助文档 - 抗肿瘤药物临床试验',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录 - 抗肿瘤药物临床试验',
      guestOnly: true,
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: {
      title: '注册 - 抗肿瘤药物临床试验',
      guestOnly: true,
    },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: {
      title: '找回密码 - 抗肿瘤药物临床试验',
      guestOnly: true,
    },
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到 - 抗肿瘤药物临床试验',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
    return
  }
  
  // 仅访客可访问的页面（登录后不能访问）
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router
