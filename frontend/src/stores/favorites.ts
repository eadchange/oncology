import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FavoriteItem, Drug, Study } from '@/types'
import { favoritesAPI } from '@/utils/api'
import { useAuthStore } from './auth'

export const useFavoritesStore = defineStore('favorites', () => {
  // 状态
  const favorites = ref<FavoriteItem[]>([])
  const isLoading = ref(false)

  // 计算属性
  const drugFavorites = computed(() => 
    favorites.value.filter(item => item.itemType === 'drug')
  )

  const studyFavorites = computed(() => 
    favorites.value.filter(item => item.itemType === 'study')
  )

  const favoriteIds = computed(() => ({
    drugs: drugFavorites.value.map(item => item.itemId),
    studies: studyFavorites.value.map(item => item.itemId),
  }))

  // 方法
  const fetchFavorites = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    isLoading.value = true
    try {
      const response = await favoritesAPI.getFavorites()
      if (response.success && response.data) {
        favorites.value = response.data.items || []
      }
    } catch (error) {
      console.error('获取收藏失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const addFavorite = async (itemType: 'drug' | 'study', itemId: number) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return { success: false, message: '请先登录' }
    }

    try {
      const response = await favoritesAPI.addFavorite({ itemType, itemId })
      if (response.success) {
        // 重新获取收藏列表
        await fetchFavorites()
      }
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '收藏失败' }
    }
  }

  const removeFavorite = async (itemType: 'drug' | 'study', itemId: number) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return { success: false, message: '请先登录' }
    }

    try {
      const response = await favoritesAPI.removeFavorite(itemType, itemId)
      if (response.success) {
        // 重新获取收藏列表
        await fetchFavorites()
      }
      return response
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || '取消收藏失败' }
    }
  }

  const toggleFavorite = async (itemType: 'drug' | 'study', itemId: number) => {
    const isFavorited = isItemFavorited(itemType, itemId)
    if (isFavorited) {
      return await removeFavorite(itemType, itemId)
    } else {
      return await addFavorite(itemType, itemId)
    }
  }

  const isItemFavorited = (itemType: 'drug' | 'study', itemId: number) => {
    return favorites.value.some(
      item => item.itemType === itemType && item.itemId === itemId
    )
  }

  const clearFavorites = () => {
    favorites.value = []
  }

  // 初始化时获取收藏列表
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) {
    fetchFavorites()
  }

  return {
    favorites,
    isLoading,
    drugFavorites,
    studyFavorites,
    favoriteIds,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isItemFavorited,
    clearFavorites,
  }
})
