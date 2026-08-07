/**
 * storage.js - 数据存储模块
 * 负责简历数据的持久化、导入导出、示例数据定义
 */

// ============================================================
// 深拷贝工具函数
// ============================================================
function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================
// 示例简历数据
// ============================================================
const SAMPLE_DATA = {
  meta: {
    template: 'classic-zh',
    themeColor: '#0f4c81',
    fontSize: 14,
    lineHeight: 1.45,
    margin: 'standard',
    darkMode: false
  },
  basicInfo: {
    name: '张三',
    phone: '13800000000',
    email: 'zhangsan@example.com',
    jobTarget: 'Java 后端开发工程师',
    website: '',
    birthDate: '2000年1月',
    hometown: '中国',
    gradSchool: '某大学',
    photo: ''
  },
  sections: [
    {
      id: 'education',
      title: '教育经历',
      icon: 'education',
      visible: true,
      order: 0,
      items: [
        {
          id: 'edu-1',
          fields: {
            school: '某大学',
            major: '软件工程',
            degree: '本科',
            startDate: '2022-09',
            endDate: '2026-06',
            gpa: '3.18',
            courses: 'Java 程序设计、C++ 程序设计、数据库原理、数据结构、计算机网络原理、操作系统、计算机组成原理等'
          }
        }
      ]
    },
    {
      id: 'skills',
      title: '专业技能',
      icon: 'skills',
      visible: true,
      order: 1,
      items: [
        { id: 'skill-1', fields: { name: 'Java 基础', description: '熟悉 Java 基础、面向对象、集合框架、异常处理与常用并发编程；了解 JVM 内存管理；熟悉 ThreadLocal 在用户上下文传递中的使用，并注意请求结束后的清理与内存泄漏防护。' } },
        { id: 'skill-2', fields: { name: '后端框架', description: '熟悉 Spring Boot、Spring MVC、Jakarta Validation 等后端开发技术，能够完成 RESTful API 设计、参数校验、统一响应封装、全局异常处理和接口跨域配置。' } },
        { id: 'skill-6', fields: { name: '认证与安全', description: '熟悉基于 JWT 与自定义 Filter 的无状态登录鉴权流程，能够结合用户上下文实现接口权限控制，防止水平越权访问。' } },
        { id: 'skill-3', fields: { name: '数据库与持久化', description: '熟悉 MySQL 与 MyBatis-Plus，掌握常见表结构设计、索引、事务、软删除和多表关联查询；了解 MySQL JSON 字段在半结构化业务数据存储中的使用场景。' } },
        { id: 'skill-4', fields: { name: '大模型应用集成', description: '熟悉 DeepSeek 等大模型 API 接入流程，掌握结构化 Prompt 设计、JSON 格式输出约束、模型响应解析、异常兜底和服务降级策略；了解 RAG 架构的基本流程与应用场景。' } },
        { id: 'skill-5', fields: { name: '开发工具', description: '熟悉 Maven、Git、Swagger/OpenAPI、Linux 常用命令，能够使用 Codex、Claude Code、Cursor 等 AI 编程工具辅助需求拆解、代码生成、问题排查与代码重构。' } }
      ]
    },
    {
      id: 'experience',
      title: '工作经历',
      icon: 'work',
      visible: false,
      order: 2,
      items: []
    },
    {
      id: 'projects',
      title: '项目经历',
      icon: 'project',
      visible: true,
      order: 3,
      items: [
        {
          id: 'proj-1',
          fields: {
            name: 'AI 驱动的大学生求职简历优化与投递管理平台',
            role: 'Java 后端 / AI 应用开发',
            startDate: '2026-03',
            endDate: '2026-06',
            techStack: 'Java 17、Spring Boot、Spring MVC、MyBatis-Plus、MySQL、JWT、Swagger/OpenAPI、DeepSeek API',
            description: '面向大学生求职场景，设计并实现集简历多版本管理、岗位 JD 管理、AI 简历匹配分析、投递进度追踪、面试复盘与数据看板于一体的求职管理平台，帮助用户完成从岗位分析、简历优化到投递复盘的闭环管理。\n负责后端核心模块设计与实现，完成用户注册登录、JWT 鉴权、自定义认证过滤器、统一响应封装、全局异常处理和参数校验等基础能力，提升接口安全性与返回结构一致性。\n设计并实现 规则匹配 + 大模型增强 的简历分析流程：基于岗位 JD 提取关键词，计算匹配评分、命中关键词、缺失关键词和修改建议，并调用 DeepSeek API 生成 AI 总结、简历改写提示和 STAR 结构化优化建议。\n设计结构化 Prompt 与 JSON 输出约束，对大模型返回内容进行解析、字段校验、长度裁剪和异常兜底，降低模型输出不稳定、格式异常和内容不可控对业务流程的影响。\n实现 AI 服务降级机制，当 DeepSeek API 未配置或调用失败时，自动切换为本地规则匹配与结构化兜底文案，保证 JD 匹配和面试复盘等核心流程可用。\n设计并实现简历、岗位、匹配报告、投递记录、面试复盘等业务模块，使用 MyBatis-Plus 对接 MySQL，完成业务数据的增删改查、软删除、关联查询与结果封装。\n实现投递管理状态机，约束投递状态在草稿、已投递、笔试、面试、Offer、拒绝、放弃等阶段的合法流转，并记录状态变更日志，便于追踪完整求职过程。\n实现面试 AI 复盘能力，根据面试轮次、问题类型、自评分、回答内容生成薄弱点、回答优化建议、可能追问和下一轮准备计划，帮助用户沉淀面试反馈。\n设计首页数据看板接口，聚合投递统计、待办事项、转化漏斗、近期趋势和薄弱关键词等数据，为用户提供求职进度分析能力。\n补充 Swagger/OpenAPI 调试入口、MySQL 初始化脚本和阶段文档，提升接口调试、数据库初始化和后续维护效率。'
          }
        }
      ]
    },
    {
      id: 'certificates',
      title: '证书荣誉',
      icon: 'cert',
      visible: true,
      order: 4,
      items: [
        { id: 'cert-1', fields: { name: '软件设计师（中级）', issuer: '掌握软件工程、数据库、计算机网络、系统设计等基础知识。', date: '2024-11' } },
        { id: 'cert-2', fields: { name: '大学英语四级 CET-4', issuer: '具备基础英文技术文档阅读能力。', date: '2023-06' } }
      ]
    },
    {
      id: 'awards',
      title: '竞赛与荣誉',
      icon: 'award',
      visible: false,
      order: 5,
      items: []
    },
    {
      id: 'summary',
      title: '自我评价',
      icon: 'summary',
      visible: true,
      order: 6,
      content: '学习能力与抗压能力较强，具备良好的逻辑思维和问题分析能力，能够较快理解业务需求并落到接口、数据表和页面联调中。做事认真负责，遇到问题能主动沟通并推进解决，愿意在项目实践中持续补齐后端开发能力。'
    }
  ]
};

// ============================================================
// 各模块字段定义（编辑器表单依据）
// ============================================================
const SECTION_FIELDS = {
  education: [
    { key: 'school', label: '学校', type: 'text', placeholder: '如：北京大学' },
    { key: 'major', label: '专业', type: 'text', placeholder: '如：计算机科学与技术' },
    { key: 'degree', label: '学位', type: 'select', options: ['本科', '硕士', '博士', '大专'] },
    { key: 'startDate', label: '开始时间', type: 'month' },
    { key: 'endDate', label: '结束时间', type: 'month' },
    { key: 'gpa', label: 'GPA/排名', type: 'text', placeholder: '如：3.8/4.0 或 前5%', optional: true },
    { key: 'courses', label: '核心课程', type: 'text', placeholder: '逗号分隔', optional: true }
  ],
  experience: [
    { key: 'company', label: '公司名称', type: 'text', placeholder: '如：字节跳动' },
    { key: 'position', label: '职位', type: 'text', placeholder: '如：前端开发实习生' },
    { key: 'startDate', label: '开始时间', type: 'month' },
    { key: 'endDate', label: '结束时间', type: 'month' },
    { key: 'techStack', label: '技术栈', type: 'text', placeholder: '如：Spring Boot、MySQL', optional: true },
    { key: 'summary', label: '项目简介', type: 'textarea', placeholder: '简要说明业务场景和覆盖流程', optional: true },
    { key: 'description', label: '工作描述', type: 'textarea', placeholder: '每行一条，使用STAR法则描述' }
  ],
  projects: [
    { key: 'name', label: '项目名称', type: 'text', placeholder: '如：在线简历编辑器' },
    { key: 'role', label: '担任角色', type: 'text', placeholder: '如：前端负责人' },
    { key: 'startDate', label: '开始时间', type: 'month' },
    { key: 'endDate', label: '结束时间', type: 'month' },
    { key: 'description', label: '项目描述', type: 'textarea', placeholder: '每行一条，突出个人贡献和量化成果' },
    { key: 'techStack', label: '技术栈', type: 'text', placeholder: '如：React, Node.js, MongoDB', optional: true }
  ],
  skills: [
    { key: 'name', label: '技能类别/名称', type: 'text', placeholder: '如：Java 基础' },
    { key: 'level', label: '掌握程度', type: 'select', options: [['expert', '精通'], ['proficient', '熟练'], ['familiar', '了解']], optional: true },
    { key: 'description', label: '详细描述', type: 'text', placeholder: '如：熟悉 Java 语法、面向对象、集合框架' }
  ],
  awards: [
    { key: 'name', label: '奖项名称', type: 'text', placeholder: '如：ACM程序设计竞赛' },
    { key: 'level', label: '等级', type: 'text', placeholder: '如：国家一等奖' },
    { key: 'date', label: '获奖时间', type: 'month' }
  ],
  certificates: [
    { key: 'name', label: '证书名称', type: 'text', placeholder: '如：CET-6 英语六级' },
    { key: 'issuer', label: '颁发机构', type: 'text', placeholder: '如：教育部考试中心', optional: true },
    { key: 'date', label: '获取时间', type: 'month' }
  ]
};

// ============================================================
// 存储键
// ============================================================
const STORAGE_KEY = 'resume-editor-data';

// ============================================================
// ResumeStorage 模块
// ============================================================
const ResumeStorage = {
  /**
   * 从 localStorage 加载数据，不存在则返回示例数据
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let parsed = JSON.parse(raw);
        // 基本数据完整性校验
        if (parsed && parsed.meta && parsed.basicInfo && Array.isArray(parsed.sections)) {
          let modified = false;

          // 1. 迁移旧样例项目，确保用户在不重置数据的情况下也能看到最新项目经历
          const projSec = parsed.sections.find(s => s.id === 'projects');
          if (projSec && Array.isArray(projSec.items)) {
            const oldSampleProjectNames = [
              '基于大模型的智能备课辅助系统',
              '智能教师备课系统(基于大模型的教案生成平台)'
            ];
            projSec.items.forEach(item => {
              if (item && item.fields && oldSampleProjectNames.includes(item.fields.name)) {
                const sampleProj = SAMPLE_DATA.sections.find(s => s.id === 'projects').items[0];
                item.fields.name = sampleProj.fields.name;
                item.fields.techStack = sampleProj.fields.techStack;
                item.fields.description = sampleProj.fields.description;
                item.fields.role = sampleProj.fields.role;
                item.fields.startDate = sampleProj.fields.startDate;
                item.fields.endDate = sampleProj.fields.endDate;
                modified = true;
              }
            });
          }

          // 2. 迁移默认专业技能（如果用户未曾修改过专业技能板块）
          const skillSec = parsed.sections.find(s => s.id === 'skills');
          if (skillSec && Array.isArray(skillSec.items)) {
            // 情况A：原本的7条旧默认技能
            const isOldDefault7 = skillSec.items.length === 7 && 
              skillSec.items[0]?.fields?.description === '熟悉 Java 语法、面向对象、集合框架、IO 流、异常处理与反射机制；了解多线程、线程池及 JVM 基础概念。';
            // 情况B：上一版修改的6条默认技能（缺了 AI 辅助编程工具）
            const isTransitional6 = skillSec.items.length === 6 && 
              skillSec.items[5]?.fields?.name === '开发工具与前端' && 
              skillSec.items[5]?.fields?.description === '熟练使用 Maven 与 Git 进行版本控制与团队协作，具备良好的接口设计规范；了解前端 Vue3 框架与页面布局。';

            if (isOldDefault7 || isTransitional6) {
              const sampleSkills = SAMPLE_DATA.sections.find(s => s.id === 'skills');
              skillSec.items = deepClone(sampleSkills.items);
              modified = true;
            }
          }

          if (modified) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('读取本地数据失败，使用默认数据：', e);
    }
    return deepClone(SAMPLE_DATA);
  },

  /**
   * 保存数据到 localStorage
   */
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('保存数据失败：', e);
      return false;
    }
  },

  /**
   * 导出数据为 JSON 文件并触发下载
   */
  exportJSON(data, versionName = '') {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const safePart = (value) => String(value || '').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80);
    const targetPart = safePart(data?.basicInfo?.jobTarget);
    const versionPart = safePart(versionName);
    const label = [data?.basicInfo?.name, versionPart || targetPart || '未命名'].filter(Boolean).join('_');
    const filename = `简历数据_${label}_${yyyy}-${mm}-${dd}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  },

  /**
   * 导入 JSON 文件，返回 Promise<data>
   */
  importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // 数据完整性校验
          if (!data || !data.meta || !data.basicInfo || !Array.isArray(data.sections)) {
            reject(new Error('JSON 文件格式不正确，缺少必要字段'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(new Error('JSON 解析失败：' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'utf-8');
    });
  },

  /**
   * 重置数据：清除 localStorage，返回示例数据的深拷贝
   */
  reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('清除本地数据失败：', e);
    }
    return deepClone(SAMPLE_DATA);
  },

  /**
   * 生成唯一 ID
   */
  generateId() {
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
};

// ============================================================
// 挂载到全局
// ============================================================
window.ResumeStorage = ResumeStorage;
window.SECTION_FIELDS = SECTION_FIELDS;
window.SAMPLE_DATA = SAMPLE_DATA;
window.deepClone = deepClone;
