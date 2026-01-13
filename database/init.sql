-- 抗肿瘤药物临床试验数据库初始化脚本
-- 遵循CDISC SDTM标准和北京市地方标准DB11/T 2275.1-2024

-- 创建数据库
CREATE DATABASE IF NOT EXISTS oncology_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE oncology_db;

-- =====================================================
-- 1. 用户和权限相关表
-- =====================================================

-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  verification_code VARCHAR(6),
  code_expires_at TIMESTAMP,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  permissions JSONB DEFAULT '[]',
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. 药物数据表（遵循全球已上市抗肿瘤药物数据规范）
-- =====================================================

-- 药物主表
CREATE TABLE drugs (
  id SERIAL PRIMARY KEY,
  generic_name VARCHAR(255) NOT NULL, -- 国际通用名
  brand_name VARCHAR(255), -- 商品名
  brand_name_cn VARCHAR(255), -- 中文商品名
  drug_class VARCHAR(100), -- 药理类别
  category VARCHAR(50), -- 治疗分类标签
  mechanism TEXT, -- 作用机制
  company VARCHAR(255), -- 生产企业
  company_id INTEGER, -- 关联企业信息表
  molecular_formula VARCHAR(255), -- 分子式
  molecular_weight DECIMAL(10,2), -- 分子量
  cas_number VARCHAR(20), -- CAS号
  atc_code VARCHAR(20), -- ATC分类代码
  drugbank_id VARCHAR(20), -- DrugBank ID
  chembl_id VARCHAR(20), -- ChEMBL ID
  pubchem_id VARCHAR(20), -- PubChem ID
  chebi_id VARCHAR(20), -- ChEBI ID
  kegg_id VARCHAR(20), -- KEGG ID
  description TEXT, -- 药物描述
  pharmacodynamics TEXT, -- 药效学
  mechanism_of_action TEXT, -- 作用机制详情
  absorption TEXT, -- 吸收
  metabolism TEXT, -- 代谢
  half_life VARCHAR(50), -- 半衰期
  protein_binding VARCHAR(100), -- 蛋白结合率
  route_of_elimination TEXT, -- 消除途径
  volume_of_distribution TEXT, -- 分布容积
  clearance TEXT, -- 清除率
  toxicity TEXT, -- 毒性信息
  contraindications TEXT, -- 禁忌症
  warnings TEXT, -- 警告
  adverse_effects TEXT, -- 不良反应
  dosage_forms TEXT, -- 剂型
  storage_conditions TEXT, -- 储存条件
  regulatory_info JSONB, -- 监管信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 药物批准信息表
CREATE TABLE drug_approvals (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  agency VARCHAR(50) NOT NULL, -- 'fda', 'ema', 'nmpa', 'pmda', 'kfda'
  approval_date DATE,
  approval_type VARCHAR(50), -- 'regular', 'accelerated', 'conditional'
  indication TEXT,
  dosage_info TEXT,
  application_number VARCHAR(100),
  product_number VARCHAR(100),
  orphan_drug BOOLEAN DEFAULT FALSE,
  breakthrough_therapy BOOLEAN DEFAULT FALSE,
  fast_track BOOLEAN DEFAULT FALSE,
  priority_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 药物适应症表
CREATE TABLE drug_indications (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  indication_name VARCHAR(255) NOT NULL,
  indication_category VARCHAR(100), -- 癌症大类
  icd10_code VARCHAR(20), -- ICD-10编码
  umls_cui VARCHAR(20), -- UMLS CUI编码
  meddra_code VARCHAR(20), -- MedDRA编码
  is_primary BOOLEAN DEFAULT FALSE, -- 是否为主要适应症
  line_of_therapy INTEGER, -- 治疗线数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 药物靶点表
CREATE TABLE drug_targets (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  target_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50), -- 'protein', 'gene', 'enzyme'
  uniprot_id VARCHAR(20), -- UniProt ID
  gene_symbol VARCHAR(50), -- 基因符号
  action VARCHAR(50), -- 'inhibitor', 'agonist', 'antagonist'
  mechanism TEXT, -- 作用机制
  references TEXT, -- 参考文献
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 药物相互作用表
CREATE TABLE drug_interactions (
  id SERIAL PRIMARY KEY,
  drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
  interacting_drug VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(100), -- 相互作用类型
  severity VARCHAR(20), -- 'minor', 'moderate', 'major'
  description TEXT,
  mechanism TEXT,
  management TEXT, -- 处理建议
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. 临床研究数据表（遵循CDISC SDTM标准）
-- =====================================================

-- 研究基本信息表
CREATE TABLE studies (
  id SERIAL PRIMARY KEY,
  nct_id VARCHAR(20) UNIQUE, -- ClinicalTrials.gov ID
  euctr_id VARCHAR(20), -- 欧盟临床试验注册号
  utn VARCHAR(50), -- WHO通用试验号
  brief_title VARCHAR(500), -- 简短标题
  official_title VARCHAR(1000), -- 官方完整标题
  brief_summary TEXT, -- 简要摘要
  detailed_description TEXT, -- 详细描述
  study_type VARCHAR(50), -- 研究类型（干预性、观察性）
  phase VARCHAR(20), -- 研究阶段（I, II, III, IV）
  allocation VARCHAR(50), -- 分组方式（随机、非随机）
  intervention_model VARCHAR(50), -- 干预模型
  primary_purpose VARCHAR(50), -- 主要目的（治疗、预防、诊断）
  masking VARCHAR(50), -- 盲法（双盲、单盲、开放）
  overall_status VARCHAR(50), -- 总体状态
  recruitment_status VARCHAR(50), -- 招募状态
  why_stopped TEXT, -- 停止原因
  start_date DATE, -- 研究开始日期
  completion_date DATE, -- 研究完成日期
  primary_completion_date DATE, -- 主要终点完成日期
  verification_date DATE, -- 数据验证日期
  last_update_posted DATE, -- 最后更新日期
  enrollment INTEGER, -- 目标入组人数
  actual_enrollment INTEGER, -- 实际入组人数
  has_expanded_access BOOLEAN DEFAULT FALSE, -- 是否有扩展访问
  biospec_retention VARCHAR(100), -- 生物样本保留
  biospec_description TEXT, -- 生物样本描述
  eligibility_criteria TEXT, -- 入组标准
  healthy_volunteers BOOLEAN, -- 是否接受健康志愿者
  gender VARCHAR(20), -- 性别要求
  minimum_age VARCHAR(20), -- 最小年龄
  maximum_age VARCHAR(20), -- 最大年龄
  study_design JSONB, -- 研究设计详情
  primary_outcomes JSONB, -- 主要结局指标
  secondary_outcomes JSONB, -- 次要结局指标
  other_outcomes JSONB, -- 其他结局指标
  conditions JSONB, -- 研究疾病/条件
  interventions JSONB, -- 干预措施
  arm_groups JSONB, -- 研究组
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 研究申办方表
CREATE TABLE study_sponsors (
  id SERIAL PRIMARY KEY,
  study_id INTEGER REFERENCES studies(id) ON DELETE CASCADE,
  sponsor_name VARCHAR(255) NOT NULL,
  sponsor_type VARCHAR(50), -- 'Industry', 'NIH', 'Other'
  sponsor_class VARCHAR(50), -- 'PRINCIPAL', 'COLLABORATOR'
  lead_sponsor BOOLEAN DEFAULT FALSE, -- 是否为主要申办方
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 研究中心表
CREATE TABLE study_sites (
  id SERIAL PRIMARY KEY,
  study_id INTEGER REFERENCES studies(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  site_country VARCHAR(100),
  site_state VARCHAR(100),
  site_city VARCHAR(100),
  site_status VARCHAR(50), -- 中心状态
  investigator_name VARCHAR(255), -- 主要研究者
  contact_info JSONB, -- 联系信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 研究结果表
CREATE TABLE study_results (
  id SERIAL PRIMARY KEY,
  study_id INTEGER REFERENCES studies(id) ON DELETE CASCADE,
  result_type VARCHAR(20), -- 'primary', 'secondary'
  outcome_title VARCHAR(500),
  outcome_description TEXT,
  time_frame VARCHAR(100),
  population_description TEXT,
  reporting_status VARCHAR(50), -- 报告状态
  has_results BOOLEAN DEFAULT FALSE,
  results_first_posted DATE,
  results_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 收藏和个性化数据表
-- =====================================================

-- 用户收藏表
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- 'drug' or 'study'
  item_id INTEGER NOT NULL, -- 关联drugs.id或studies.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, item_type, item_id)
);

-- 用户搜索历史表
CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  search_type VARCHAR(20), -- 'drug', 'study'
  search_query VARCHAR(500),
  search_filters JSONB, -- 搜索筛选条件
  result_count INTEGER,
  clicked_results JSONB, -- 点击的结果
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. 网站配置和管理表
-- =====================================================

-- 网站配置表
CREATE TABLE site_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(20) DEFAULT 'string', -- 'string', 'json', 'boolean', 'number'
  description TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 广告位配置表
CREATE TABLE ad_positions (
  id SERIAL PRIMARY KEY,
  position_key VARCHAR(50) UNIQUE NOT NULL, -- 位置标识
  position_name VARCHAR(100) NOT NULL, -- 位置名称
  position_description TEXT,
  width INTEGER, -- 宽度
  height INTEGER, -- 高度
  ad_type VARCHAR(50), -- 'image', 'text', 'html'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 广告内容表
CREATE TABLE advertisements (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES ad_positions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT, -- 广告内容
  ad_url TEXT, -- 链接地址
  image_url TEXT, -- 图片地址
  start_date DATE,
  end_date DATE,
  max_impressions INTEGER, -- 最大展示次数
  max_clicks INTEGER, -- 最大点击次数
  current_impressions INTEGER DEFAULT 0, -- 当前展示次数
  current_clicks INTEGER DEFAULT 0, -- 当前点击次数
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- 优先级
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 广告统计表
CREATE TABLE ad_statistics (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES advertisements(id) ON DELETE CASCADE,
  position_key VARCHAR(50) NOT NULL,
  display_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE operation_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- 可为空（系统操作）
  admin_id INTEGER, -- 可为空
  operation_type VARCHAR(50), -- 操作类型
  operation_desc TEXT, -- 操作描述
  ip_address INET,
  user_agent TEXT,
  request_url TEXT,
  request_method VARCHAR(10),
  request_data JSONB,
  response_status INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据抓取日志表
CREATE TABLE scraping_logs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- 数据源（fda, nmpa, clinicaltrials等）
  status VARCHAR(20), -- 'success', 'failed', 'running'
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  items_processed INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  log_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. 帮助和支持相关表
-- =====================================================

-- 帮助文档分类表
CREATE TABLE help_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  category_key VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id INTEGER REFERENCES help_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 帮助文档表
CREATE TABLE help_articles (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES help_categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags JSONB,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 常见问题表
CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 意见反馈表
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50), -- 'bug', 'feature', 'general'
  subject VARCHAR(255),
  content TEXT NOT NULL,
  contact_info VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'resolved'
  admin_reply TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. 创建索引
-- =====================================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_verified ON users(is_verified);

-- 药物表索引
CREATE INDEX idx_drugs_generic ON drugs(generic_name);
CREATE INDEX idx_drugs_brand ON drugs(brand_name);
CREATE INDEX idx_drugs_brand_cn ON drugs(brand_name_cn);
CREATE INDEX idx_drugs_company ON drugs(company);
CREATE INDEX idx_drugs_company_id ON drugs(company_id);
CREATE INDEX idx_drugs_category ON drugs(category);
CREATE INDEX idx_drugs_drug_class ON drugs(drug_class);
CREATE INDEX idx_drugs_atc ON drugs(atc_code);
CREATE INDEX idx_drugs_drugbank ON drugs(drugbank_id);

-- 药物批准索引
CREATE INDEX idx_drug_approvals_drug_id ON drug_approvals(drug_id);
CREATE INDEX idx_drug_approvals_agency ON drug_approvals(agency);
CREATE INDEX idx_drug_approvals_date ON drug_approvals(approval_date);

-- 药物适应症索引
CREATE INDEX idx_drug_indications_drug_id ON drug_indications(drug_id);
CREATE INDEX idx_drug_indications_name ON drug_indications(indication_name);
CREATE INDEX idx_drug_indications_category ON drug_indications(indication_category);

-- 研究表索引
CREATE INDEX idx_studies_nct ON studies(nct_id);
CREATE INDEX idx_studies_euctr ON studies(euctr_id);
CREATE INDEX idx_studies_title ON studies(brief_title);
CREATE INDEX idx_studies_status ON studies(overall_status);
CREATE INDEX idx_studies_phase ON studies(phase);
CREATE INDEX idx_studies_type ON studies(study_type);
CREATE INDEX idx_studies_start_date ON studies(start_date);
CREATE INDEX idx_studies_completion_date ON studies(completion_date);

-- 研究申办方索引
CREATE INDEX idx_study_sponsors_study_id ON study_sponsors(study_id);
CREATE INDEX idx_study_sponsors_name ON study_sponsors(sponsor_name);

-- 研究中心索引
CREATE INDEX idx_study_sites_study_id ON study_sites(study_id);
CREATE INDEX idx_study_sites_country ON study_sites(site_country);

-- 收藏表索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_type, item_id);

-- 广告统计索引
CREATE INDEX idx_ad_statistics_ad_id ON ad_statistics(ad_id);
CREATE INDEX idx_ad_statistics_position ON ad_statistics(position_key);
CREATE INDEX idx_ad_statistics_date ON ad_statistics(date);

-- 操作日志索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_admin_id ON operation_logs(admin_id);
CREATE INDEX idx_operation_logs_type ON operation_logs(operation_type);
CREATE INDEX idx_operation_logs_created ON operation_logs(created_at);

-- 帮助文档索引
CREATE INDEX idx_help_articles_category ON help_articles(category_id);
CREATE INDEX idx_help_articles_slug ON help_articles(slug);

-- =====================================================
-- 8. 插入初始数据
-- =====================================================

-- 插入管理员账户（账号: eadchange, 密码: 7dummg2w+）
INSERT INTO admins (username, password_hash, role, permissions) VALUES 
('eadchange', '$2b$10$rOvFTJg6/8SH5K4K5J6J6O/KfJ6/KfJ6', 'super_admin', 
 '["all"]');

-- 插入网站配置
INSERT INTO site_config (config_key, config_value, config_type, description) VALUES 
('site_name', '抗肿瘤药物临床试验', 'string', '网站名称'),
('site_description', '专业的抗肿瘤药物和临床试验信息平台', 'string', '网站描述'),
('contact_email', 'oncology@yunqiaomedical.com', 'string', '联系邮箱'),
('contact_phone', '', 'string', '联系电话'),
('site_domain', 'oncology.yunqiaomedical.com', 'string', '网站域名'),
('page_size', '20', 'number', '默认分页大小'),
('max_login_attempts', '5', 'number', '最大登录尝试次数'),
('session_timeout', '30', 'number', '会话超时时间（分钟）'),
('captcha_enabled', 'true', 'boolean', '是否启用验证码'),
('sms_enabled', 'true', 'boolean', '是否启用短信验证'),
('data_update_interval', '24', 'number', '数据更新间隔（小时）');

-- 插入广告位
INSERT INTO ad_positions (position_key, position_name, position_description, width, height, ad_type) VALUES 
('header_banner', '页头横幅广告', '网站顶部横幅广告位', 1200, 90, 'image'),
('sidebar_top', '侧边栏顶部', '页面侧边栏顶部广告位', 300, 250, 'image'),
('sidebar_bottom', '侧边栏底部', '页面侧边栏底部广告位', 300, 250, 'image'),
('footer_banner', '页脚横幅广告', '网站底部横幅广告位', 1200, 60, 'image'),
('content_top', '内容区顶部', '主要内容区域顶部广告', 728, 90, 'image'),
('content_bottom', '内容区底部', '主要内容区域底部广告', 728, 90, 'image');

-- 插入帮助文档分类
INSERT INTO help_categories (category_name, category_key, description, sort_order) VALUES 
('网站使用指南', 'user-guide', '网站功能使用说明', 1),
('常见问题', 'faq', '常见问题解答', 2),
('账户管理', 'account', '账户注册、登录、安全相关', 3),
('数据查询', 'search', '药物和研究查询功能', 4),
('收藏功能', 'favorites', '收藏和管理收藏', 5),
('法律条款', 'legal', '免责声明、隐私政策、服务条款', 6);

-- 插入示例帮助文档
INSERT INTO help_articles (category_id, title, slug, summary, content, is_published, tags) VALUES 
(1, '如何搜索药物信息', 'how-to-search-drugs', '了解如何快速搜索和筛选药物信息', 
 '详细的使用指南内容...', true, '["搜索", "药物", "查询"]'),
(1, '如何查找临床研究', 'how-to-find-studies', '学习如何搜索和查看临床研究信息', 
 '详细的使用指南内容...', true, '["临床研究", "搜索", "查询"]'),
(3, '如何注册账户', 'how-to-register', '新用户注册步骤说明', 
 '详细的注册流程说明...', true, '["注册", "账户", "新用户"]'),
(3, '如何找回密码', 'how-to-reset-password', '忘记密码时的重置方法', 
 '详细的密码重置步骤...', true, '["密码", "重置", "找回"]');

-- 插入常见问题
INSERT INTO faqs (question, answer, category, sort_order) VALUES 
('如何注册账户？', '点击右上角的"注册"按钮，填写必要信息即可完成注册。', 'account', 1),
('忘记密码怎么办？', '点击登录页面的"忘记密码"链接，通过手机验证码重置密码。', 'account', 2),
('如何收藏感兴趣的药物或研究？', '在详情页面点击"收藏"按钮即可添加到个人收藏。', 'favorites', 3),
('数据多久更新一次？', '系统每天自动更新数据，确保信息的时效性。', 'general', 4),
('如何联系客服？', '可以通过邮箱 oncology@yunqiaomedical.com 联系我们。', 'contact', 5);

-- =====================================================
-- 9. 创建全文搜索索引
-- =====================================================

-- 药物全文搜索索引
CREATE INDEX idx_drugs_fulltext ON drugs 
USING gin(to_tsvector('english', 
  coalesce(generic_name, '') || ' ' || 
  coalesce(brand_name, '') || ' ' || 
  coalesce(brand_name_cn, '') || ' ' || 
  coalesce(drug_class, '') || ' ' || 
  coalesce(mechanism, '') || ' ' || 
  coalesce(company, '')
));

-- 研究全文搜索索引
CREATE INDEX idx_studies_fulltext ON studies 
USING gin(to_tsvector('english', 
  coalesce(brief_title, '') || ' ' || 
  coalesce(official_title, '') || ' ' || 
  coalesce(brief_summary, '') || ' ' || 
  coalesce(conditions::text, '')
));

-- =====================================================
-- 10. 创建触发器函数（用于自动更新updated_at字段）
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_positions_updated_at BEFORE UPDATE ON ad_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_categories_updated_at BEFORE UPDATE ON help_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON help_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 脚本执行完成
-- =====================================================

SELECT '数据库初始化完成' AS status;
