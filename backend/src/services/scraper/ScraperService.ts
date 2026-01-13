import axios, { AxiosInstance } from 'axios'
import { PrismaClient } from '@prisma/client'
import { logger, logPerformance } from '../../utils/logger'
import { prisma } from '../../index'

export interface ScrapingResult {
  source: string
  status: 'success' | 'failed' | 'partial'
  itemsProcessed: number
  itemsAdded: number
  itemsUpdated: number
  itemsFailed: number
  duration: number
  error?: string
}

export class ScraperService {
  private prisma: PrismaClient
  private rateLimitDelay: number
  private maxRetries: number

  constructor() {
    this.prisma = prisma
    this.rateLimitDelay = 1000 // 1秒延迟
    this.maxRetries = 3
  }

  /**
   * 延迟执行
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 重试机制
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.rateLimitDelay * (this.maxRetries - retries + 1))
        return this.withRetry(fn, retries - 1)
      }
      throw error
    }
  }

  /**
   * 记录抓取日志
   */
  private async logScraping(
    source: string,
    status: string,
    details: Partial<ScrapingResult>
  ): Promise<void> {
    await this.prisma.scrapingLog.create({
      data: {
        source,
        status,
        itemsProcessed: details.itemsProcessed || 0,
        itemsAdded: details.itemsAdded || 0,
        itemsUpdated: details.itemsUpdated || 0,
        itemsFailed: details.itemsFailed || 0,
        errorMessage: details.error,
        logDetails: JSON.stringify(details),
      },
    })
  }

  /**
   * FDA数据抓取
   */
  async scrapeFDAData(): Promise<ScrapingResult> {
    const startTime = Date.now()
    let result: ScrapingResult = {
      source: 'fda',
      status: 'success',
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      duration: 0,
    }

    try {
      logger.info('Starting FDA data scraping...')

      const fdaApi = axios.create({
        baseURL: 'https://api.fda.gov',
        timeout: 30000,
        headers: {
          'X-API-Key': process.env.FDA_API_KEY || '',
        },
      })

      // 搜索抗肿瘤药物
      const searchTerms = [
        'cancer',
        'tumor',
        'oncology',
        'malignant',
        'chemotherapy',
        'immunotherapy',
        'targeted',
      ]

      for (const term of searchTerms) {
        try {
          const response = await this.withRetry(() =>
            fdaApi.get('/drug/label.json', {
              params: {
                search: `indications_and_usage:"${term}"`,
                limit: 100,
              },
            })
          )

          const drugs = response.data.results || []
          
          for (const drug of drugs) {
            await this.processFDADrug(drug)
            result.itemsProcessed++
            await this.delay(this.rateLimitDelay)
          }

          logger.info(`Processed ${drugs.length} FDA drugs for term: ${term}`)
        } catch (error) {
          logger.error(`Error processing FDA term ${term}:`, error)
          result.itemsFailed++
        }
      }

      result.duration = Date.now() - startTime
      await this.logScraping('fda', 'success', result)
      
      logger.info(`FDA scraping completed: ${result.itemsProcessed} items processed`)
      
    } catch (error) {
      result.status = 'failed'
      result.error = error instanceof Error ? error.message : 'Unknown error'
      result.duration = Date.now() - startTime
      
      await this.logScraping('fda', 'failed', result)
      logger.error('FDA scraping failed:', error)
    }

    return result
  }

  /**
   * 处理FDA药物数据
   */
  private async processFDADrug(drugData: any): Promise<void> {
    try {
      const genericName = this.extractGenericName(drugData)
      const brandName = this.extractBrandName(drugData)
      const indications = this.extractIndications(drugData)
      
      if (!genericName) {
        logger.warn('Skipping drug without generic name')
        return
      }

      // 查找或创建药物记录
      const existingDrug = await this.prisma.drug.findFirst({
        where: {
          OR: [
            { genericName: { equals: genericName, mode: 'insensitive' } },
            ...(brandName ? [{ brandName: { equals: brandName, mode: 'insensitive' } }] : []),
          ],
        },
      })

      const drugInfo = {
        genericName,
        brandName,
        drugClass: this.extractDrugClass(drugData),
        category: this.categorizeDrug(drugData),
        mechanism: this.extractMechanism(drugData),
        company: this.extractCompany(drugData),
        indications,
        description: this.extractDescription(drugData),
        molecularFormula: this.extractMolecularFormula(drugData),
        atcCode: this.extractATCCode(drugData),
        updatedAt: new Date(),
      }

      if (existingDrug) {
        // 更新现有记录
        await this.prisma.drug.update({
          where: { id: existingDrug.id },
          data: {
            ...drugInfo,
            approvals: this.mergeApprovals(existingDrug.approvals, ['fda']),
            fdaDate: this.extractApprovalDate(drugData) || existingDrug.fdaDate,
          },
        })
      } else {
        // 创建新记录
        await this.prisma.drug.create({
          data: {
            ...drugInfo,
            approvals: ['fda'],
            fdaDate: this.extractApprovalDate(drugData),
            createdAt: new Date(),
          },
        })
      }
    } catch (error) {
      logger.error('Error processing FDA drug:', error)
      throw error
    }
  }

  /**
   * ClinicalTrials.gov数据抓取
   */
  async scrapeClinicalTrialsData(): Promise<ScrapingResult> {
    const startTime = Date.now()
    let result: ScrapingResult = {
      source: 'clinicaltrials',
      status: 'success',
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      duration: 0,
    }

    try {
      logger.info('Starting ClinicalTrials.gov data scraping...')

      const ctApi = axios.create({
        baseURL: 'https://clinicaltrials.gov/api',
        timeout: 30000,
      })

      // 搜索肿瘤相关研究
      const conditions = [
        'cancer',
        'tumor',
        'oncology',
        'malignant',
        'carcinoma',
        'sarcoma',
        'leukemia',
        'lymphoma',
      ]

      for (const condition of conditions) {
        try {
          const response = await this.withRetry(() =>
            ctApi.get('/v2/studies', {
              params: {
                'query.cond': condition,
                'pageSize': 100,
                'format': 'json',
                'fields': 'NCTId,briefTitle,officialTitle,briefSummary,overallStatus,phase,studyType,sponsor,conditions,interventions,startDate,completionDate,enrollment',
              },
            })
          )

          const studies = response.data.studies || []
          
          for (const study of studies) {
            await this.processClinicalTrial(study)
            result.itemsProcessed++
            await this.delay(this.rateLimitDelay)
          }

          logger.info(`Processed ${studies.length} ClinicalTrials for condition: ${condition}`)
        } catch (error) {
          logger.error(`Error processing ClinicalTrials condition ${condition}:`, error)
          result.itemsFailed++
        }
      }

      result.duration = Date.now() - startTime
      await this.logScraping('clinicaltrials', 'success', result)
      
      logger.info(`ClinicalTrials scraping completed: ${result.itemsProcessed} items processed`)
      
    } catch (error) {
      result.status = 'failed'
      result.error = error instanceof Error ? error.message : 'Unknown error'
      result.duration = Date.now() - startTime
      
      await this.logScraping('clinicaltrials', 'failed', result)
      logger.error('ClinicalTrials scraping failed:', error)
    }

    return result
  }

  /**
   * 处理临床研究数据
   */
  private async processClinicalTrial(studyData: any): Promise<void> {
    try {
      const nctId = studyData.protocolSection?.identificationModule?.nctId
      
      if (!nctId) {
        logger.warn('Skipping study without NCT ID')
        return
      }

      const existingStudy = await this.prisma.study.findUnique({
        where: { nctId },
      })

      const studyInfo = {
        nctId,
        briefTitle: studyData.protocolSection?.identificationModule?.briefTitle,
        officialTitle: studyData.protocolSection?.identificationModule?.officialTitle,
        briefSummary: studyData.protocolSection?.descriptionModule?.briefSummary,
        phase: this.extractStudyPhase(studyData),
        studyType: studyData.protocolSection?.designModule?.studyType,
        overallStatus: studyData.protocolSection?.statusModule?.overallStatus,
        recruitmentStatus: studyData.protocolSection?.statusModule?.recruitmentStatus,
        sponsor: this.extractSponsor(studyData),
        collaborators: this.extractCollaborators(studyData),
        conditions: this.extractConditions(studyData),
        interventions: this.extractInterventions(studyData),
        eligibilityCriteria: studyData.protocolSection?.eligibilityModule?.eligibilityCriteria,
        startDate: this.parseDate(studyData.protocolSection?.statusModule?.startDateStruct?.date),
        completionDate: this.parseDate(studyData.protocolSection?.statusModule?.completionDateStruct?.date),
        enrollment: studyData.protocolSection?.designModule?.enrollmentInfo?.count,
        hasResults: this.checkHasResults(studyData),
        resultsFirstPosted: this.parseDate(studyData.protocolSection?.resultsModule?.resultsFirstPostedDate),
        updatedAt: new Date(),
      }

      if (existingStudy) {
        // 更新现有记录
        await this.prisma.study.update({
          where: { id: existingStudy.id },
          data: studyInfo,
        })
      } else {
        // 创建新记录
        await this.prisma.study.create({
          data: {
            ...studyInfo,
            createdAt: new Date(),
          },
        })
      }
    } catch (error) {
      logger.error('Error processing clinical trial:', error)
      throw error
    }
  }

  /**
   * NMPA数据抓取（网页抓取）
   */
  async scrapeNMPAData(): Promise<ScrapingResult> {
    const startTime = Date.now()
    let result: ScrapingResult = {
      source: 'nmpa',
      status: 'success',
      itemsProcessed: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      duration: 0,
    }

    try {
      logger.info('Starting NMPA data scraping...')

      // 这里实现NMPA网站的爬虫逻辑
      // 由于NMPA网站结构可能变化，需要根据实际情况调整选择器
      
      logger.info('NMPA scraping completed')
      
    } catch (error) {
      result.status = 'failed'
      result.error = error instanceof Error ? error.message : 'Unknown error'
      result.duration = Date.now() - startTime
      
      await this.logScraping('nmpa', 'failed', result)
      logger.error('NMPA scraping failed:', error)
    }

    return result
  }

  // 辅助方法
  private extractGenericName(drugData: any): string {
    return drugData.openfda?.generic_name?.[0] || 
           drugData.substanceName || 
           drugData.active_ingredient?.[0] ||
           ''
  }

  private extractBrandName(drugData: any): string {
    return drugData.openfda?.brand_name?.[0] || 
           drugData.proprietaryName || 
           ''
  }

  private extractIndications(drugData: any): string[] {
    const indications = drugData.indications_and_usage || []
    return Array.isArray(indications) ? indications : [indications]
  }

  private extractDrugClass(drugData: any): string {
    return drugData.openfda?.pharm_class_moa?.[0] || 
           drugData.drug_class || 
           ''
  }

  private categorizeDrug(drugData: any): string {
    const mechanisms = (drugData.openfda?.mechanism_of_action || []).join(' ').toLowerCase()
    const indications = (drugData.indications_and_usage || []).join(' ').toLowerCase()
    
    if (mechanisms.includes('checkpoint inhibitor') || 
        mechanisms.includes('pd-1') || 
        mechanisms.includes('pd-l1')) {
      return 'immunotherapy'
    }
    
    if (mechanisms.includes('kinase inhibitor') || 
        mechanisms.includes('monoclonal antibody')) {
      return 'targeted'
    }
    
    if (indications.includes('chemotherapy') || 
        drugData.openfda?.drug_class?.includes('antineoplastic')) {
      return 'chemotherapy'
    }
    
    return 'other'
  }

  private extractMechanism(drugData: any): string {
    return drugData.openfda?.mechanism_of_action?.[0] || 
           drugData.mechanismOfAction || 
           ''
  }

  private extractCompany(drugData: any): string {
    return drugData.openfda?.manufacturer_name?.[0] || 
           drugData.company || 
           ''
  }

  private extractDescription(drugData: any): string {
    return drugData.description?.[0] || 
           drugData.purpose?.[0] || 
           ''
  }

  private extractMolecularFormula(drugData: any): string {
    return drugData.openfda?.molecular_formula?.[0] || ''
  }

  private extractATCCode(drugData: any): string {
    return drugData.openfda?.atc_code?.[0] || ''
  }

  private extractApprovalDate(drugData: any): Date | null {
    const dateStr = drugData.openfda?.approval_date?.[0]
    return dateStr ? new Date(dateStr) : null
  }

  private mergeApprovals(existing: string[] | null, newApprovals: string[]): string[] {
    const approvals = new Set(existing || [])
    newApprovals.forEach(approval => approvals.add(approval))
    return Array.from(approvals)
  }

  private extractStudyPhase(studyData: any): string {
    const phase = studyData.protocolSection?.designModule?.phase || 
                  studyData.phase || 
                  ''
    return phase.toString()
  }

  private extractSponsor(studyData: any): string {
    const sponsors = studyData.protocolSection?.sponsorCollaboratorsModule?.leadSponsor || {}
    return sponsors.name || ''
  }

  private extractCollaborators(studyData: any): string[] {
    const collaborators = studyData.protocolSection?.sponsorCollaboratorsModule?.collaborators || []
    return collaborators.map((c: any) => c.name).filter(Boolean)
  }

  private extractConditions(studyData: any): string[] {
    const conditions = studyData.protocolSection?.conditionsModule?.conditions || []
    return conditions.map((c: any) => c.name).filter(Boolean)
  }

  private extractInterventions(studyData: any): string[] {
    const interventions = studyData.protocolSection?.armsInterventionsModule?.interventions || []
    return interventions.map((i: any) => i.name).filter(Boolean)
  }

  private parseDate(dateStruct: any): Date | null {
    if (!dateStruct) return null
    
    const { year, month, day } = dateStruct
    if (!year || !month || !day) return null
    
    return new Date(year, month - 1, day)
  }

  private checkHasResults(studyData: any): boolean {
    return !!studyData.protocolSection?.resultsModule
  }

  /**
   * 启动所有数据抓取任务
   */
  async startAllScraping(): Promise<ScrapingResult[]> {
    logger.info('Starting all data scraping jobs...')
    
    const results: ScrapingResult[] = []
    
    try {
      // 并行执行所有抓取任务
      const tasks = [
        this.scrapeFDAData(),
        this.scrapeClinicalTrialsData(),
        // this.scrapeNMPAData(), // NMPA需要特殊处理
      ]
      
      const taskResults = await Promise.allSettled(tasks)
      
      for (const result of taskResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          logger.error('Scraping task failed:', result.reason)
        }
      }
      
      logger.info('All scraping jobs completed')
      
    } catch (error) {
      logger.error('Error in scraping jobs:', error)
    }
    
    return results
  }
}

// 单例实例
export const scraperService = new ScraperService()
