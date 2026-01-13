// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  phone?: string
  isVerified: boolean
  emailVerifiedAt?: string
  phoneVerifiedAt?: string
  lastLoginAt?: string
  loginCount: number
  createdAt: string
}

export interface LoginForm {
  login: string // 可以是邮箱、手机号或用户名
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  verificationCode?: string
}

// 药物相关类型
export interface Drug {
  id: number
  genericName: string
  brandName?: string
  brandNameCn?: string
  drugClass?: string
  category?: string
  mechanism?: string
  company?: string
  companyId?: number
  molecularFormula?: string
  molecularWeight?: number
  casNumber?: string
  atcCode?: string
  drugbankId?: string
  chemblId?: string
  pubchemId?: string
  description?: string
  indications?: string[]
  approvals?: string[]
  fdaDate?: string
  nmpaDate?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface DrugApproval {
  id: number
  drugId: number
  agency: string
  approvalDate?: string
  approvalType?: string
  indication?: string
  dosageInfo?: string
  applicationNumber?: string
  orphanDrug: boolean
  breakthroughTherapy: boolean
  fastTrack: boolean
  priorityReview: boolean
}

export interface DrugIndication {
  id: number
  drugId: number
  indicationName: string
  indicationCategory?: string
  icd10Code?: string
  isPrimary: boolean
  lineOfTherapy?: number
}

// 临床研究相关类型
export interface Study {
  id: number
  nctId?: string
  euctrId?: string
  utn?: string
  briefTitle?: string
  officialTitle?: string
  briefSummary?: string
  detailedDescription?: string
  studyType?: string
  phase?: string
  allocation?: string
  interventionModel?: string
  primaryPurpose?: string
  masking?: string
  overallStatus?: string
  recruitmentStatus?: string
  whyStopped?: string
  startDate?: string
  completionDate?: string
  primaryCompletionDate?: string
  verificationDate?: string
  lastUpdatePosted?: string
  enrollment?: number
  actualEnrollment?: number
  hasExpandedAccess?: boolean
  eligibilityCriteria?: string
  healthyVolunteers?: boolean
  gender?: string
  minimumAge?: string
  maximumAge?: string
  conditions?: string[]
  interventions?: string[]
  sponsors?: StudySponsor[]
  sites?: StudySite[]
  createdAt: string
  updatedAt: string
}

export interface StudySponsor {
  id: number
  studyId: number
  sponsorName: string
  sponsorType?: string
  sponsorClass?: string
  leadSponsor: boolean
}

export interface StudySite {
  id: number
  studyId: number
  siteName: string
  siteCountry?: string
  siteState?: string
  siteCity?: string
  siteStatus?: string
  investigatorName?: string
  contactInfo?: Record<string, any>
}

// 分页相关类型
export interface PaginationParams {
  page: number
  size: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 搜索相关类型
export interface SearchFilters {
  category?: string
  phase?: string
  status?: string
  sponsor?: string
  condition?: string
  country?: string
  agency?: string
  dateRange?: [string, string]
}

export interface SearchParams extends PaginationParams {
  keyword?: string
  filters?: SearchFilters
  sort?: string
  order?: 'asc' | 'desc'
}

// 收藏相关类型
export interface Favorite {
  id: number
  userId: number
  itemType: 'drug' | 'study'
  itemId: number
  createdAt: string
}

export interface FavoriteItem extends Favorite {
  item?: Drug | Study
}

// 网站配置类型
export interface SiteConfig {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone?: string
  siteDomain: string
  pageSize: number
  maxLoginAttempts: number
  sessionTimeout: number
  captchaEnabled: boolean
  smsEnabled: boolean
  dataUpdateInterval: number
}

// 广告相关类型
export interface AdPosition {
  id: number
  positionKey: string
  positionName: string
  positionDescription?: string
  width?: number
  height?: number
  adType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Advertisement {
  id: number
  positionId: number
  title?: string
  content?: string
  adUrl?: string
  imageUrl?: string
  startDate?: string
  endDate?: string
  maxImpressions?: number
  maxClicks?: number
  currentImpressions: number
  currentClicks: number
  isActive: boolean
  priority: number
  position?: AdPosition
  createdAt: string
  updatedAt: string
}

// 帮助文档类型
export interface HelpCategory {
  id: number
  categoryName: string
  categoryKey: string
  description?: string
  sortOrder: number
  parentId?: number
  isActive: boolean
  children?: HelpCategory[]
  createdAt: string
  updatedAt: string
}

export interface HelpArticle {
  id: number
  categoryId: number
  title: string
  slug: string
  content: string
  summary?: string
  tags?: string[]
  viewCount: number
  isPublished: boolean
  category?: HelpCategory
  createdAt: string
  updatedAt: string
}

// 常见问题类型
export interface FAQ {
  id: number
  question: string
  answer: string
  category?: string
  sortOrder: number
  isActive: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

// 用户反馈类型
export interface Feedback {
  id: number
  userId?: number
  feedbackType: 'bug' | 'feature' | 'general'
  subject?: string
  content: string
  contactInfo?: string
  status: 'pending' | 'processing' | 'resolved'
  adminReply?: string
  repliedAt?: string
  createdAt: string
  updatedAt: string
}

// 数据抓取日志类型
export interface ScrapingLog {
  id: number
  source: string
  status: 'success' | 'failed' | 'running'
  startTime?: string
  endTime?: string
  itemsProcessed: number
  itemsAdded: number
  itemsUpdated: number
  itemsFailed: number
  errorMessage?: string
  logDetails?: string
  createdAt: string
}

// 操作日志类型
export interface OperationLog {
  id: number
  userId?: number
  adminId?: number
  operationType: string
  operationDesc?: string
  ipAddress?: string
  userAgent?: string
  requestUrl?: string
  requestMethod?: string
  requestData?: Record<string, any>
  responseStatus?: number
  createdAt: string
}
