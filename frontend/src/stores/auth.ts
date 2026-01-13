import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm, RegisterForm } from '@/types'
import { authAPI } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 方法
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const login = async (form: LoginForm) => {
    isLoading.value = true
    try {
      const response = await authAPI.login(form)
      if (response.success && response.data) {
        setToken(response.data.token)
        setUser(response.data.user)
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (form: RegisterForm) => {
    isLoading.value = true
    try {
      const response = await authAPI.register(form)
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const fetchUser = async () => {
    if (!token.value) return
    
    try {
      const response = await authAPI.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      // Token可能已过期
      setToken(null)
      setUser(null)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    isLoading.value = true
    try {
      const response = await authAPI.updateProfile(data)
      if (response.success && response.data) {
        setUser(response.data)
      }
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '更新失败' }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    isLoading.value = true
    try {
      const response = await authAPI.changePassword({ oldPassword, newPassword })
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '修改失败' }
    } finally {
      isLoading.value = false
    }
  }

  const sendVerificationCode = async (phone: string, type: 'register' | 'reset-password') => {
    try {
      const response = await authAPI.sendVerificationCode(phone, type)
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '发送失败' }
    }
  }

  // 初始化时获取用户信息
  if (token.value) {
    fetchUser()
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    setToken,
    setUser,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    changePassword,
    sendVerificationCode,
  }
})
