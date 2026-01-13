import axios from 'axios'
import type { 
  ApiResponse, 
  User, 
  LoginForm, 
  RegisterForm,
  Drug,
  Study,
  SearchParams,
  PaginatedResponse,
  Favorite,
  FavoriteItem,
  HelpCategory,
  HelpArticle,
  FAQ,
  Feedback,
  SiteConfig
} from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关API
export const authAPI = {
  // 登录
  login: (data: LoginForm) => {
    return api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data)
  },

  // 注册
  register: (data: RegisterForm) => {
    return api.post<ApiResponse>('/auth/register', data)
  },

  // 获取用户信息
  getProfile: () => {
    return api.get<ApiResponse<User>>('/auth/profile')
  },

  // 更新用户信息
  updateProfile: (data: Partial<User>) => {
    return api.put<ApiResponse<User>>('/auth/profile', data)
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) => {
    return api.post<ApiResponse>('/auth/change-password', data)
  },

  // 发送验证码
  sendVerificationCode: (phone: string, type: 'register' | 'reset-password') => {
    return api.post<ApiResponse>('/auth/send-code', { phone, type })
  },

  // 重置密码
  resetPassword: (data: { phone: string; code: string; newPassword: string }) => {
    return api.post<ApiResponse>('/auth/reset-password', data)
  },

  // 刷新Token
  refreshToken: () => {
    return api.post<ApiResponse<{ token: string }>>('/auth/refresh')
  },

  // 退出登录
  logout: () => {
    return api.post<ApiResponse>('/auth/logout')
  },
}

// 药物相关API
export const drugsAPI = {
  // 获取药物列表
  getDrugs: (params: SearchParams) => {
    return api.get<ApiResponse<PaginatedResponse<Drug>>>('/drugs', { params })
  },

  // 获取药物详情
  getDrug: (id: number) => {
    return api.get<ApiResponse<Drug>>(`/drugs/${id}`)
  },

  // 获取热门药物
  getHotDrugs: (limit = 10) => {
    return api.get<ApiResponse<Drug[]>>('/drugs/hot', { params: { limit } })
  },

  // 获取药物分类统计
  getCategoryStats: () => {
    return api.get<ApiResponse<Record<string, number>>>('/drugs/category-stats')
  },
}

// 临床研究相关API
export const studiesAPI = {
  // 获取研究列表
  getStudies: (params: SearchParams) => {
    return api.get<ApiResponse<PaginatedResponse<Study>>>('/studies', { params })
  },

  // 获取研究详情
  getStudy: (id: number) => {
    return api.get<ApiResponse<Study>>(`/studies/${id}`)
  },

  // 获取热门研究
  getHotStudies: (limit = 10) => {
    return api.get<ApiResponse<Study[]>>('/studies/hot', { params: { limit } })
  },

  // 获取研究统计
  getStats: () => {
    return api.get<ApiResponse<Record<string, number>>>('/studies/stats')
  },
}

// 收藏相关API
export const favoritesAPI = {
  // 获取收藏列表
  getFavorites: (type?: 'drug' | 'study') => {
    return api.get<ApiResponse<{ items: FavoriteItem[] }>>('/favorites', { 
      params: { type } 
    })
  },

  // 添加收藏
  addFavorite: (data: { itemType: 'drug' | 'study'; itemId: number }) => {
    return api.post<ApiResponse>('/favorites', data)
  },

  // 取消收藏
  removeFavorite: (itemType: 'drug' | 'study', itemId: number) => {
    return api.delete<ApiResponse>(`/favorites/${itemType}/${itemId}`)
  },
}

// 搜索相关API
export const searchAPI = {
  // 搜索建议
  getSuggestions: (keyword: string, type?: 'drug' | 'study') => {
    return api.get<ApiResponse<string[]>>('/search/suggestions', {
      params: { keyword, type },
    })
  },

  // 全局搜索
  globalSearch: (keyword: string, params?: SearchParams) => {
    return api.get<ApiResponse<{
      drugs: PaginatedResponse<Drug>
      studies: PaginatedResponse<Study>
    }>>('/search', { params: { keyword, ...params } })
  },
}

// 帮助文档相关API
export const helpAPI = {
  // 获取帮助分类
  getCategories: () => {
    return api.get<ApiResponse<HelpCategory[]>>('/help/categories')
  },

  // 获取帮助文章列表
  getArticles: (categoryId?: number) => {
    return api.get<ApiResponse<HelpArticle[]>>(`/help/articles`, {
      params: { categoryId },
    })
  },

  // 获取帮助文章详情
  getArticle: (slug: string) => {
    return api.get<ApiResponse<HelpArticle>>(`/help/articles/${slug}`)
  },

  // 获取常见问题
  getFAQs: () => {
    return api.get<ApiResponse<FAQ[]>>('/help/faqs')
  },
}

// 反馈相关API
export const feedbackAPI = {
  // 提交反馈
  submitFeedback: (data: {
    feedbackType: 'bug' | 'feature' | 'general'
    subject?: string
    content: string
    contactInfo?: string
  }) => {
    return api.post<ApiResponse>('/feedback', data)
  },
}

// 网站配置相关API
export const configAPI = {
  // 获取网站配置
  getSiteConfig: () => {
    return api.get<ApiResponse<SiteConfig>>('/config/site')
  },

  // 获取统计数据
  getStats: () => {
    return api.get<ApiResponse<{
      drugCount: number
      studyCount: number
      sponsorCount: number
      siteCount: number
    }>>('/config/stats')
  },
}

// 文件上传API
export const uploadAPI = {
  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export default api
