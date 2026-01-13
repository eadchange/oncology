import dayjs from 'dayjs'
import { debounce } from 'lodash-es'

// 日期格式化
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow()
}

// 数字格式化
export const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 截断文本
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 高亮搜索关键词
export const highlightKeyword = (text: string, keyword: string) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 防抖函数
export const debounceFn = (fn: Function, delay: number) => {
  return debounce(fn, delay)
}

// 节流函数
export const throttle = (fn: Function, delay: number) => {
  let lastTime = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
  }
}

// 验证邮箱
export const isValidEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// 验证手机号
export const isValidPhone = (phone: string) => {
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone)
}

// 验证密码强度
export const getPasswordStrength = (password: string) => {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return strength
}

export const getPasswordStrengthText = (strength: number) => {
  if (strength <= 1) return '弱'
  if (strength <= 3) return '中'
  return '强'
}

// 生成随机字符串
export const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// 下载文件
export const downloadFile = (url: string, filename?: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 复制到剪贴板
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  }
}

// 本地存储封装
export const storage = {
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },
  get: (key: string, defaultValue?: any) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  },
}

// 会话存储封装
export const sessionStorage = {
  set: (key: string, value: any) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('SessionStorage set error:', error)
    }
  },
  get: (key: string, defaultValue?: any) => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('SessionStorage get error:', error)
      return defaultValue
    }
  },
  remove: (key: string) => {
    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error('SessionStorage remove error:', error)
    }
  },
  clear: () => {
    try {
      window.sessionStorage.clear()
    } catch (error) {
      console.error('SessionStorage clear error:', error)
    }
  },
}

// 页面标题管理
export const setPageTitle = (title: string) => {
  document.title = title ? `${title} - 抗肿瘤药物临床试验` : '抗肿瘤药物临床试验'
}

// 滚动到顶部
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 滚动到元素
export const scrollToElement = (selector: string, offset = 0) => {
  const element = document.querySelector(selector)
  if (element) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// 判断元素是否在视口内
export const isInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// 图片懒加载
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]')
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        img.src = img.dataset.src!
        img.removeAttribute('data-src')
        observer.unobserve(img)
      }
    })
  })
  images.forEach(img => imageObserver.observe(img))
}
