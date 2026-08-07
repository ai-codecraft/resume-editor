/**
 * resume-versions-target.js - 面向不同岗位的内置简历版本与本地版本管理。
 * 所有内置版本都以 storage.js 中的默认个人资料为基础，只调整求职意向、技能、项目和自我评价。
 */
(function () {
  'use strict';

  if (!window.SAMPLE_DATA) {
    console.error('Resume versions require SAMPLE_DATA from storage.js.');
    return;
  }

  // v10：Java 简历改为票务选座项目，并更新专业技能与实习表述。
  const VERSION_STORE_KEY = 'resume-editor-version-store-v10';
  const ACTIVE_VERSION_KEY = 'resume-editor-active-version-v10';
  const STORE_SCHEMA_VERSION = 10;
  const ORIGINAL_VERSION_ID = 'original-default';
  const DEFAULT_ACTIVE_VERSION_ID = 'java-backend';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function skill(id, name, description) {
    return { id, fields: { name, description } };
  }

  function project(id, name, role, startDate, endDate, techStack, lines) {
    return {
      id,
      fields: {
        name,
        role,
        startDate,
        endDate,
        techStack,
        description: lines.join('\n')
      }
    };
  }


  function workExperience(id, company, position, startDate, endDate, techStack, summary, lines) {
    return {
      id,
      fields: {
        company,
        position,
        startDate,
        endDate,
        techStack,
        summary,
        description: lines.join('\n')
      }
    };
  }

  const careerPlatform = {
    java: project(
      'career-java',
      'AI 驱动的大学生求职简历优化与投递管理平台',
      'Java 后端 / 核心功能开发',
      '2026-03',
      '2026-07',
      'Java 17、Spring Boot 3、Spring MVC、MyBatis-Plus、MySQL、JWT、Swagger/OpenAPI、DeepSeek API',
      [
        '项目简介：面向大学生求职场景，提供简历多版本、岗位 JD、匹配分析、投递追踪、面试复盘和数据看板等闭环能力。',
        '负责用户、简历、岗位、匹配报告、投递记录和面试复盘等模块，完成 RESTful API、参数校验、统一响应与全局异常处理。',
        '基于 JWT 与自定义 Filter 实现无状态登录鉴权，结合用户上下文和数据归属校验限制接口访问，降低水平越权风险。',
        '设计投递状态机及状态变更日志，约束草稿、已投递、笔试、面试、Offer、拒绝等阶段的合法流转。',
        '使用 MyBatis-Plus 对接 MySQL，完成表结构设计、软删除、关联查询和聚合统计，并通过 Swagger/OpenAPI 提供接口调试入口。'
      ]
    ),
    ai: project(
      'career-ai',
      'AI 驱动的大学生求职简历优化与投递管理平台',
      'AI 应用后端 / Prompt 与业务流程开发',
      '2026-03',
      '2026-07',
      'Java 17、Spring Boot 3、MySQL、DeepSeek API、结构化 Prompt、JSON Schema 思路、规则匹配',
      [
        '项目简介：将岗位 JD、简历分析和面试复盘接入大模型，形成“规则可解释 + 模型增强 + 失败可降级”的求职辅助流程。',
        '负责“规则匹配 + 大模型增强”链路，提取岗位关键词并输出匹配分、命中项、缺失项和针对性修改建议。',
        '设计结构化 Prompt 与 JSON 输出约束，对模型响应执行解析、字段校验、长度裁剪和异常兜底，降低格式漂移对业务的影响。',
        '实现 AI 服务降级：API 未配置、超时或调用失败时自动切换到本地规则和结构化兜底文案，保证核心流程可用。',
        '将面试轮次、问题类型、自评分和回答内容组合为复盘上下文，生成薄弱点、回答优化、可能追问和下一轮准备计划。'
      ]
    ),
    testing: project(
      'career-testing',
      'AI 驱动的大学生求职简历优化与投递管理平台',
      '后端测试 / 接口与业务规则验证',
      '2026-03',
      '2026-07',
      'JUnit 5、Spring Boot Test、MockMvc、MySQL、Swagger/OpenAPI、JWT',
      [
        '项目简介：围绕登录鉴权、投递状态流转和 AI Prompt 等高风险模块设计单元测试与接口测试。',
        '使用 MockMvc 验证注册、登录和受保护接口访问流程，覆盖正常登录、未授权访问、非法参数和错误响应结构。',
        '针对投递状态机编写合法与非法状态迁移用例，验证边界条件、异常分支和业务约束。',
        '针对结构化 Prompt 的输入裁剪、必要字段和异常参数编写 JUnit 5 测试，降低模型上下文构造回归风险。',
        '结合 Swagger/OpenAPI 与数据库记录核对接口返回、鉴权结果和状态日志，形成可复现的问题定位路径。'
      ]
    ),
    fullstack: project(
      'career-fullstack',
      '大学生求职简历优化与投递管理平台',
      '全栈开发 / 简历编辑子模块',
      '2026-03',
      '2026-07',
      'Java 17、Spring Boot 3、MyBatis-Plus、MySQL、HTML、CSS、JavaScript、localStorage、html2pdf.js',
      [
        '项目简介：由求职管理工作台、Spring Boot 后端和可独立运行的简历编辑器组成，覆盖简历优化到投递复盘的完整流程。',
        '负责后端用户、简历、岗位、匹配、投递和面试模块，完成 JWT 鉴权、RESTful API、数据建模和异常处理。',
        '使用原生 JavaScript 构建简历编辑子模块，实现表单编辑、实时预览、模板切换、本地草稿、JSON 导入导出和 PDF 输出。',
        '实现多岗位简历版本切换和版本独立保存，使 Java、前端、测试、AI 应用等版本可以分别维护与导出。',
        '编写 MySQL 初始化脚本、接口文档和启动说明，完成前后端联调与异常场景排查。'
      ]
    ),
    support: project(
      'career-support',
      '大学生求职简历优化与投递管理平台',
      '部署联调 / 技术文档与问题排查',
      '2026-03',
      '2026-07',
      'Java 17、Spring Boot 3、MySQL、Maven、Swagger/OpenAPI、HTML/CSS/JavaScript',
      [
        '项目简介：提供简历、岗位、匹配、投递和面试管理能力，前端静态工作台与 Spring Boot 后端可独立启动。',
        '负责整理前后端启动流程、MySQL 初始化脚本、环境变量说明和接口清单，降低本地部署与演示成本。',
        '使用 Swagger/OpenAPI 验证接口参数、鉴权和返回结构，结合日志、数据库记录和浏览器网络请求定位联调问题。',
        '为 DeepSeek API 配置、超时、无密钥和调用失败等情况设计明确提示及本地降级方案，保证演示连续性。',
        '编写阶段文档、数据库文档和问题排查说明，能够将技术问题转化为可执行的处理步骤。'
      ]
    )
  };

  const contractCollectionInternship = workExperience(
    'java-contract-collection-internship',
    '湘南湘西高新软件园',
    'Java 后端开发｜客户合同与回款管理系统',
    '2025-07',
    '2025-09',
    'Spring Boot、MyBatis-Plus、MySQL、Swagger',
    '',
    [
      '参与面向销售、商务及财务场景的客户合同与回款管理系统开发，重点负责回款计划、到账登记模块的后端接口、数据校验及前后端联调。',
      '根据合同金额、回款比例和约定日期生成分期回款计划，在事务内完成期次生成与金额校验，并通过“合同 ID＋期次”唯一约束避免重复生成。',
      '实现分次到账登记与累计实收金额计算，维护待回款、部分回款和已结清状态，拦截作废合同、已结清计划及超额回款等异常操作，并记录状态变化。',
      '针对负责人、回款状态和到期日期等组合查询设计联合索引，支持临期及逾期计划筛选；完成客户、合同批量导入、逐行校验和错误信息反馈。'
    ]
  );

  const cinemaTicketingSystem = project(
    'java-cinema-ticketing',
    '影院票务与选座系统',
    '后端开发',
    '2026-03',
    '2026-07',
    'Java 17、Spring Boot 3、Spring Security、JWT、MyBatis-Plus、MySQL、Redis、RabbitMQ、JUnit 5、MockMvc、Docker Compose',
    [
      '设计影厅模板、场次座位快照、票务订单及状态日志等核心模型，实现排片、座位查询、锁座、支付确认、超时取消和退票流程。',
      '针对多人并发选择同一座位的问题，通过数据库条件更新完成座位“空闲→锁定”的原子流转，并以订单座位唯一约束作为一致性兜底，避免重复售票。',
      '基于 RabbitMQ 延迟消息释放超时未支付订单，使用状态条件更新与幂等消费处理支付回调和超时消息并发到达的竞态，避免已支付订单被错误取消。',
      '使用 Redis 缓存场次座位图，座位状态变更后按事务提交结果失效缓存，并通过限购规则限制单用户单场次锁座数量。',
      '使用 JUnit 5、MockMvc 编写并发锁座、重复回调、超时释放和非法状态流转测试，通过 Docker Compose 完成 MySQL、Redis、RabbitMQ 本地联调。'
    ]
  );

  const externalProjects = {
    frontend: project(
      'external-ai-data-frontend',
      'AI 数据分析运营后台（个人项目）',
      '前端开发 / 数据工作台与可视化',
      '2026-04',
      '2026-07',
      'Vue 3、Vite、TypeScript、Element Plus、Pinia、Vue Router、Axios、ECharts、SSE',
      [
        '项目简介：面向企业数据分析场景，提供数据源配置、自然语言查询、报表任务和指标看板等后台页面。',
        '基于 Vue 3 Composition API、TypeScript、Pinia 和 Vue Router 拆分登录、数据源、查询工作台、任务历史和报表详情等页面。',
        '封装 Axios 请求、JWT 失效处理和统一错误提示，完成表单校验、分页查询、权限路由、空状态和加载态等通用交互。',
        '使用 SSE 接收查询计划、SQL 校验、执行进度和结果整理事件，按阶段更新任务状态并支持失败重试和结果回溯。',
        '使用 Element Plus 与 ECharts 实现数据源表单、指标卡片、趋势图和报表展示，优化复杂表格、筛选条件和响应式布局。'
      ]
    ),
    testing: project(
      'external-ai-data-testing',
      'AI 数据分析平台接口与端到端自动化测试（个人项目）',
      '测试开发 / 接口与 UI 自动化',
      '2026-04',
      '2026-07',
      'Java、JUnit 5、Rest Assured、Playwright Java、Testcontainers、MySQL、Mockito、Allure',
      [
        '项目简介：围绕数据源配置、权限、自然语言查询和报表任务设计接口、UI、集成和异常场景测试。',
        '使用 Rest Assured 覆盖登录、数据源、查询会话、任务状态和权限接口，校验状态码、JSON Schema、数据归属和错误响应结构。',
        '使用 Playwright Java 编写登录、创建数据源、发起查询、查看报表和失败重试的端到端用例，覆盖表单、列表、弹窗和异步状态变化。',
        '使用 Testcontainers 启动隔离 MySQL/Redis 依赖，通过 Mock 模型响应稳定 AI 测试结果，并对生成 SQL 执行只读、表名和危险语句断言。',
        '补充超时、无数据、模型不可用、非法参数、越权访问和重复提交用例，生成 Allure/Surefire 报告并整理可复现的问题定位路径。'
      ]
    ),
    fullstack: project(
      'external-workorder-fullstack',
      '企业工单与服务运营平台（个人项目）',
      'Java 全栈 / 工单业务模块开发',
      '2026-04',
      '2026-07',
      'Java 17、Spring Boot 3、Spring Security、MyBatis-Plus、MySQL、Redis、Vue 3、TypeScript、Element Plus、Docker',
      [
        '项目简介：面向企业内部服务团队，提供工单创建、分派、处理、SLA 提醒、操作日志和运营看板等闭环能力。',
        '后端完成工单、分类、优先级、处理记录和状态日志的数据建模，开发 RESTful API、JWT 鉴权、数据权限和统一异常处理。',
        '设计待处理、已分派、处理中、待确认、已关闭等状态的合法流转，记录操作人、时间和处理说明，保证流程可追溯。',
        '前端使用 Vue 3、TypeScript、Pinia 和 Element Plus 实现工单列表、详情、分派、处理、筛选和统计页面，完成接口联调和表单校验。',
        '使用 Redis 缓存列表查询和待办统计，编写 MySQL 初始化脚本、Docker Compose 启动说明和接口测试用例，完成本地部署演示。'
      ]
    ),
    support: project(
      'external-multitenant-support',
      '多租户业务管理平台部署实施（个人项目）',
      '软件实施 / 环境部署与问题排查',
      '2026-04',
      '2026-07',
      'Java 17、Spring Boot、Vue 3、MySQL、Redis、Docker Compose、Nginx、Linux、Swagger/OpenAPI',
      [
        '项目简介：面向多租户业务管理系统，整理从环境准备、数据库初始化、服务启动到接口联调和问题定位的可复现交付流程。',
        '编写 Docker Compose、环境变量、MySQL 初始化、Redis 配置和 Nginx 反向代理说明，完成前后端服务启动与访问验证。',
        '使用 Swagger/OpenAPI、浏览器网络面板和数据库记录核对接口参数、鉴权、跨域、数据权限和返回结果，定位联调问题。',
        '从启动日志、配置文件、网络端口、SQL、缓存和对象存储等层面排查启动失败、接口异常、数据不一致和文件上传问题。',
        '整理部署清单、演示数据、常见故障处理步骤和版本回滚说明，能够将技术问题转化为客户或团队可执行的操作文档。'
      ]
    )
  };

  const teacherPrep = {
    java: project(
      'teacher-java',
      '智能教师备课系统',
      'Java 后端 / AI 流式生成',
      '2026-06',
      '2026-07',
      'Java 17、Spring Boot 3、Spring Security、JWT、MyBatis-Plus、MySQL、OkHttp、SSE、JUnit 5',
      [
        '项目简介：面向中小学教师的 AI 备课平台，可根据学科、年级和课题流式生成结构化教案，并支持编辑、收藏和历史管理。',
        '负责 Controller-Service-Mapper 分层、统一返回体、全局异常处理及用户、教案、模板等模块的数据建模与分页查询。',
        '使用 SseEmitter、独立线程池和 OkHttp 消费大模型流式响应，将 token 实时推送前端，结束后更新教案状态并持久化完整内容。',
        '基于 Spring Security + JWT 实现 USER/ADMIN 权限控制，对教案操作执行数据归属校验并统一返回 401/403 JSON。',
        '基于 requestId 与数据库唯一约束实现生成幂等，结合定时任务清理长期停留在 GENERATING 状态的异常记录。'
      ]
    ),
    frontend: project(
      'teacher-frontend',
      '智能教师备课系统',
      'Vue 3 前端 / 流式交互开发',
      '2026-06',
      '2026-07',
      'Vue 3、Vite、Pinia、Vue Router、Element Plus、Axios、fetch-event-source、Marked、DOMPurify',
      [
        '项目简介：面向教师的 AI 备课 Web 应用，覆盖登录注册、教案生成、历史管理、详情编辑、数据看板和管理员配置。',
        '使用 Vue 3 Composition API、Pinia 和 Vue Router 组织页面、用户状态和路由权限，封装 Axios 请求及 JWT 失效处理。',
        '使用 fetch-event-source 携带 JWT 接收后端 SSE，按 meta、message、done、error 事件更新页面，实现教案内容逐字渲染。',
        '结合 Marked 渲染 Markdown，并通过 DOMPurify 清理 HTML，兼顾 AI 内容展示效果与前端安全。',
        '基于 Element Plus 实现表单校验、分页列表、弹窗和响应式布局，统一加载、空状态和错误反馈。'
      ]
    ),
    ai: project(
      'teacher-ai',
      '智能教师备课系统',
      '大模型应用开发 / 流式生成与模型接入',
      '2026-06',
      '2026-07',
      'Spring Boot 3、OkHttp、SSE、DeepSeek、阿里百炼、智谱 GLM、Prompt、MySQL',
      [
        '项目简介：将结构化备课需求转换为 Prompt，调用 OpenAI 兼容模型流式生成教学目标、重难点、教学过程、板书和作业。',
        '负责统一大模型调用层，将供应商抽象为 Base URL、Chat Path、API Key 和模型列表，支持 DeepSeek、百炼、智谱等运行时切换。',
        '使用 OkHttp 解析流式响应并通过 SSE 转发 token，设计 meta、message、done、error 事件协议连接前后端状态。',
        '实现供应商与模型合法性校验、密钥后端保存、错误事件返回及生成失败状态落库，避免无效请求和敏感配置泄露。',
      ]
    ),
    testing: project(
      'teacher-testing',
      '智能教师备课系统',
      '后端测试 / 服务与安全模块验证',
      '2026-06',
      '2026-07',
      'JUnit 5、Mockito、MockMvc、Spring Security Test、MySQL、SSE',
      [
        '项目简介：针对鉴权、异常处理、教案服务、模型供应商配置和 Prompt 构建等模块补充自动化测试。',
        '编写 20 个 JUnit 5 测试，使用 Mockito 隔离 Mapper、模型服务和外部依赖，验证正常流程、异常分支与调用顺序。',
        '使用 MockMvc 验证全局异常处理的 HTTP 状态码与统一 JSON 结构，覆盖参数错误和业务异常。',
        '针对 JWT 生成、解析、过期和非法签名设计边界用例，并检查权限失败时的统一响应。',
        '验证教案归属校验、requestId 幂等、模型选择和 Prompt 构造，提升核心业务改动后的回归可信度。'
      ]
    ),
    fullstack: project(
      'teacher-fullstack',
      '智能教师备课系统',
      '全栈开发 / AI 流式生成',
      '2026-06',
      '2026-07',
      'Vue 3、Pinia、Element Plus、Spring Boot 3、Spring Security、JWT、MyBatis-Plus、MySQL、SSE',
      [
        '项目简介：前后端分离的 AI 备课平台，教师填写结构化参数后可流式生成并管理教案。',
        '后端完成 JWT 鉴权、用户与教案 CRUD、分页查询、数据归属校验、统一异常处理及模型供应商配置。',
        '前端使用 Vue 3、Pinia、Vue Router 和 Element Plus 构建登录、生成、列表、详情和管理端页面。',
        '打通 fetch-event-source 与 SseEmitter 的流式链路，根据事件类型实时更新页面并处理取消、失败和完成状态。',
        '围绕接口联调处理 JWT 续用、表单校验、Markdown 安全渲染、错误提示和数据回显。'
      ]
    ),
    support: project(
      'teacher-support',
      '智能教师备课系统',
      '应用部署 / 配置与故障排查',
      '2026-06',
      '2026-07',
      'Spring Boot 3、Vue 3、MySQL、Maven、npm、Swagger/OpenAPI、DeepSeek API',
      [
        '项目简介：前后端分离的 AI 备课系统，涉及数据库、JWT、模型供应商、SSE 和前端静态资源等多类配置。',
        '整理 Java、Maven、Node.js、MySQL 的启动条件和配置步骤，维护开发环境配置、初始化 SQL 与测试账号说明。',
        '针对数据库连接、JWT 失效、模型密钥、跨域、SSE 中断和接口异常等场景形成分层排查思路。',
        '通过 Swagger/OpenAPI、浏览器网络面板、后端日志和数据库状态交叉验证问题，缩短前后端联调定位路径。',
        '编写项目介绍、演示流程和面试讲解材料，能够向非开发人员说明功能流程和常见操作。'
      ]
    )
  };

  const campusKnowledge = {
    java: project(
      'knowledge-java',
      '校园智能知识库与服务平台',
      'Java 后端 / RAG 检索链路开发',
      '2026-06',
      '2026-07',
      'Java 17、Spring Boot 3、MyBatis-Plus、MySQL 8、Sa-Token、DeepSeek API、JUnit 5',
      [
        '项目简介：面向校园办事问答的知识库系统，支持文章管理、轻量 RAG 问答、回答依据展示和用户反馈闭环。',
        '负责认证、分类、文章、知识切片、问答记录和后台统计等接口，使用 Sa-Token 区分 ADMIN/USER 权限。',
        '实现文章切片、Mock Embedding、MySQL 向量 JSON 存储、Java 余弦相似度召回和关键词混合排序。',
        '封装 AI 调用适配层，在 DeepSeek 未配置时使用 Mock AI，保证本地环境可启动、可测试和可演示。',
        '记录命中文章、chunk、向量分、关键词分、最终分和用户反馈，支持管理员定位低质量回答与知识缺口。'
      ]
    ),
    frontend: project(
      'knowledge-frontend',
      '校园智能知识库与服务平台',
      'Vue 3 + TypeScript 前端开发',
      '2026-06',
      '2026-07',
      'Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus、Axios、ECharts',
      [
        '项目简介：包含学生知识问答与管理员知识库后台，支持文章浏览、智能问答、回答依据和数据统计。',
        '使用 Vue 3 script setup 与 TypeScript 开发用户端、管理端布局及文章、分类、问答记录、模型配置等页面。',
        '按 auth、article、category、qa、rag 等领域拆分 API 模块，通过 Axios 拦截器统一携带登录态和处理异常。',
        '结合 Pinia 与 Vue Router 实现用户状态、角色路由和菜单高亮，基于 Element Plus 完成分页、表单和弹窗交互。',
        '使用 ECharts 展示后台统计，并在问答页呈现命中文章、片段内容和检索分数，增强结果可解释性。'
      ]
    ),
    ai: project(
      'knowledge-ai',
      '校园智能知识库与服务平台',
      'Java / RAG 应用开发',
      '2026-06',
      '2026-07',
      'Java 17、Spring Boot 3、MySQL 8、RAG、Embedding、混合检索、DeepSeek API、JUnit 5',
      [
        '项目简介：围绕校园规章和办事流程构建轻量 RAG 应用，支持知识维护、智能问答、回答依据展示和用户反馈。',
        '实现文章切片、索引更新和向量存储，在 Java 层完成余弦相似度召回，并融合关键词得分进行混合排序。',
        '将命中片段、文章标题和分类拼接为受约束 Prompt，回答同时返回来源文章与引用内容，降低无依据生成。',
        '通过统一 AI Gateway 适配 DeepSeek 和本地 Mock 响应，在未配置外部密钥时仍可完成开发、测试与演示。',
        '记录问答、命中片段、检索分数和用户反馈，使用 JUnit 5 覆盖切片、相似度、Prompt 组装和无结果兜底等场景。'
      ]
    ),
    testing: project(
      'knowledge-testing',
      '校园智能知识库与服务平台',
      'RAG 单元测试 / 算法边界验证',
      '2026-06',
      '2026-07',
      'JUnit 5、Spring Boot Test、H2、Java、RAG、Prompt',
      [
        '项目简介：围绕切片、Embedding、相似度计算、Prompt 拼接和 Mock AI 补充可重复执行的单元测试。',
        '编写 9 个 JUnit 5 测试，覆盖文本切片长度、空输入、确定性 Mock Embedding、Prompt 上下文和回答格式。',
        '验证相同输入向量结果稳定、不同输入具有区分度，并检查召回上下文缺失时的兜底行为。',
        '使用 H2 作为测试数据库，避免测试依赖本地 MySQL 数据，提升环境可重复性。',
        '结合接口文档和演示清单验证登录、角色权限、问答记录、点赞点踩及索引重建流程。'
      ]
    ),
    fullstack: project(
      'knowledge-fullstack',
      '校园智能知识库与服务平台',
      '全栈开发 / RAG 问答',
      '2026-06',
      '2026-07',
      'Vue 3、TypeScript、Element Plus、ECharts、Spring Boot 3、MyBatis-Plus、MySQL、Sa-Token',
      [
        '项目简介：由学生问答端、知识文章端和管理员后台组成，提供可解释的校园知识问答。',
        '后端完成登录权限、文章与分类 CRUD、知识切片、混合检索、AI 回答、问答记录和反馈统计。',
        '前端使用 Vue 3 + TypeScript 构建用户端与管理端，按领域封装 Axios API，并用 Pinia 管理登录状态。',
        '使用 Element Plus 实现分页表格、表单校验和抽屉编辑，使用 ECharts 展示问题热度与反馈统计。',
        '前后端联调展示命中文章、chunk 和检索分数，使 AI 回答具备来源依据和问题追踪能力。'
      ]
    )
  };

  const aiAgentPortfolio = project(
    'ai-agent-portfolio',
    '企业知识检索与任务协同 Agent',
    'Python / Agent 应用开发',
    '2026-04',
    '2026-07',
    'Python、FastAPI、LangGraph、DeepSeek API、RAG、Chroma、SSE、Pydantic、Docker',
    [
      '项目简介：面向企业制度、产品手册和岗位资料查询场景，构建支持知识检索、工具调用、过程展示和来源返回的应用型 Agent。',
      '使用 LangGraph 设计 Router → Planner → Retriever/Tool → Verifier → Answer 状态流程，根据问题类型选择检索、信息提取、任务整理和摘要生成等步骤。',
      '实现文档解析、分块、Embedding、Chroma 向量存储、TopK 召回和关键词补充排序，将命中片段与来源信息注入受约束上下文。',
      '封装知识库检索、关键词提取、结构化摘要和待办生成等工具，使用 Pydantic 校验调用参数与 JSON 结果，避免字段缺失和格式漂移。',
      '使用 FastAPI 提供会话与任务接口，通过 SSE 推送路由、检索、工具调用、校验和最终回答等状态，并处理取消、失败与重试。',
      '针对模型超时、工具异常、解析失败和无证据回答设计重试、人工确认与规则兜底，并通过离线问题集和用户反馈检查回答质量。'
    ]
  );

  const productCollaborationPlatform = project(
    'product-collaboration-platform',
    '大学生求职简历优化与投递管理平台（个人产品项目）',
    '产品设计 / 需求分析与项目协作',
    '2025-12',
    '2026-03',
    '需求分析、业务流程、PRD、原型设计、JD 匹配、投递管理、面试复盘、AI 应用',
    [
      '项目简介：面向大学生求职场景，围绕“简历优化—岗位匹配—投递跟踪—面试复盘”设计一体化求职管理平台，形成从岗位分析到投递复盘的完整业务闭环。',
      '梳理学生用户在多份简历维护、岗位筛选、简历适配和求职进度跟踪中的核心痛点，明确学生用户与管理员的角色边界，拆解简历、岗位、匹配、投递、面试和数据看板等功能模块，规划 MVP 范围及迭代优先级。',
      '设计多版本简历管理和“一岗一简历”流程，明确简历复制、默认版本、岗位关联、投递前人工审核、简历 PDF 快照及确认记录等关键规则，增强简历与岗位的对应性和投递过程的可追溯性。',
      '设计 JD 与简历匹配流程，采用“规则匹配 + AI 增强”的产品方案，输出匹配分、命中项、缺失项和针对性修改建议，并补充无密钥、模型超时、调用失败及缺少可靠依据等异常场景的提示和降级方案。',
      '梳理投递状态机及状态日志，明确待投递、已投递、笔试、面试、Offer、拒绝等状态的合法流转、失败原因和下一步待办；结合优先级、截止日期和收藏能力设计岗位决策台，帮助用户安排投递顺序。',
      '设计面试复盘和数据看板功能，支持按面试轮次记录面试问题、回答情况、自评分和薄弱题型，聚合投递统计、转化漏斗、近期趋势和薄弱关键词，输出需求说明、核心流程图、页面原型、异常场景清单和功能验收要点。'
    ]
  );

  const productAiKnowledgeAssistant = project(
    'product-ai-knowledge-assistant',
    '企业知识与流程助手（个人产品项目）',
    '',
    '2026-04',
    '2026-07',
    '需求分析、流程设计、RAG、Agent、Prompt、AI 评测',
    [
      '项目简介：面向企业制度、产品资料和业务流程查询场景，设计支持知识检索、智能问答、来源查看和问题反馈的 AI 应用。',
      '围绕资料分散、关键词检索效率低和回答缺少依据等问题，梳理员工、资料维护人员和管理者的使用场景，明确首版功能范围。',
      '规划资料管理、智能提问、来源引用、历史记录和回答反馈等模块，设计“问题输入—意图识别—知识检索—答案生成—反馈改进”的核心流程。',
      '针对无可靠依据、资料过期、问题不清晰、模型超时和服务异常等情况，补充提示、重试、人工确认和规则降级方案。',
      '设计回答质量反馈维度和离线问题集，从准确性、来源匹配、回答完整性和问题解决程度等方面验证产品效果。',
      '输出产品需求说明、核心流程图、页面原型、异常场景清单和功能验收要点，并结合实现成本调整 MVP 范围。'
    ]
  );

  const resumeEditorProject = project(
    'resume-editor-frontend',
    '多岗位大学生简历编辑器',
    '前端开发 / 编辑器与打印排版',
    '2026-06',
    '2026-07',
    'HTML5、CSS3、JavaScript、localStorage、模块化设计、Drag & Drop、html2pdf.js',
    [
      '项目简介：无需构建即可运行的单页简历编辑器，支持多岗位版本、实时预览、模板切换、本地保存和 PDF 输出。',
      '使用原生 JavaScript 将存储、编辑、模板、预览、拖拽和应用协调拆分为独立模块，降低页面逻辑耦合。',
      '实现表单数据驱动预览、板块增删与排序、撤销重做、JSON 导入导出及不同岗位版本的独立 localStorage 保存。',
      '针对 A4 单页输出实现溢出检测、字号/行高/边距搜索和安全区适配，减少浏览器打印与 PDF 导出的临界分页。',
      '使用 CSS 变量实现主题色、字体、间距和多模板切换，并完善响应式工具栏与明暗模式。'
    ]
  );


  const mallBusinessProject = project(
    'mall-business-management',
    '商城业务管理系统',
    'Java 全栈 / AI 应用开发',
    '2026-03',
    '2026-07',
    'Java 17、Spring Boot 3、Spring Security、MyBatis-Plus、MySQL、Redis、Vue 3、TypeScript、Element Plus、Spring AI、SSE、JUnit 5、Docker Compose',
    [
      '面向商城运营人员，围绕商品、SKU、库存、订单、发货、售后和运营看板构建管理后台，将需求拆分为可独立交付的小功能并完成前后端闭环。',
      '后端设计用户角色、商品 SKU、库存流水、订单、售后工单和状态日志等模型，开发 RESTful API，并通过 Spring Security + JWT 实现角色权限与数据访问控制。',
      '设计待支付、待发货、已发货、已完成、已取消及售后处理等状态流转，使用事务、条件更新、业务单号和唯一约束处理库存预占/释放与重复请求。',
      '前端使用 Vue 3、TypeScript、Pinia 和 Element Plus 实现商品维护、订单列表与详情、异常处理、售后分派、操作记录和数据看板，并完成接口联调。',
      '使用 Spring AI 将售后描述结构化为类别、优先级和摘要，结合售后规则生成处理建议与回复草稿；通过人工确认、超时处理和规则降级保证流程可用。',
      '开发过程中使用 Codex、Claude Code 等 AI 开发工具辅助编码、SQL、测试清单和问题定位，并使用 ChatGPT、Claude 等模型进行方案参考；通过文档、日志、测试和实际运行验证输出。',
      '使用 JUnit 5、MockMvc 和 Playwright 验证权限、状态流转、幂等、AI 降级及核心页面流程；通过 Docker Compose 完成前后端、MySQL、Redis 的部署与演示环境验证。'
    ]
  );

  function createResume(config) {
    const data = clone(window.SAMPLE_DATA);
    data.meta = {
      ...data.meta,
      template: 'classic-zh',
      themeColor: config.themeColor || '#0f4c81',
      fontSize: config.fontSize || 13,
      lineHeight: config.lineHeight || 1.35,
      margin: config.margin || 'compact',
      fontFamily: 'sans-serif',
      spacingScale: config.spacingScale ?? 1,
      fitSectionGap: config.fitSectionGap ?? 0,
      fitItemGap: config.fitItemGap ?? 0,
      versionId: config.id,
      versionName: config.name,
      targetKeywords: config.keywords
    };
    data.basicInfo = {
      ...data.basicInfo,
      jobTarget: config.jobTarget
    };

    const education = data.sections.find((section) => section.id === 'education');
    const skills = data.sections.find((section) => section.id === 'skills');
    const experience = data.sections.find((section) => section.id === 'experience');
    const projects = data.sections.find((section) => section.id === 'projects');
    const certificates = data.sections.find((section) => section.id === 'certificates');
    const awards = data.sections.find((section) => section.id === 'awards');
    const summary = data.sections.find((section) => section.id === 'summary');

    if (education?.items?.[0]?.fields) {
      education.items[0].fields.courses = config.courses || education.items[0].fields.courses;
    }
    if (skills) {
      skills.items = config.skills;
      skills.visible = true;
      skills.order = 1;
    }
    if (experience) {
      experience.title = config.experienceTitle || '工作经历';
      experience.items = config.experiences || [];
      experience.visible = experience.items.length > 0;
      experience.order = 2;
    }
    if (projects) {
      projects.items = config.projects;
      projects.visible = true;
      projects.order = 3;
    }
    if (certificates) {
      certificates.visible = true;
      certificates.order = 4;
      certificates.items = [
        { id: 'cert-1', fields: { name: '软件设计师（中级）', issuer: '计算机技术与软件专业技术资格', date: '2024-11' } },
        { id: 'cert-2', fields: { name: '大学英语四级 CET-4', issuer: '具备英文技术文档基础阅读能力', date: '2023-06' } }
      ];
    }
    if (awards) {
      awards.visible = false;
      awards.items = [];
      awards.order = 5;
    }
    if (summary) {
      summary.title = config.summaryTitle || '自我评价';
      summary.content = config.summary;
      summary.visible = config.summaryVisible !== false;
      summary.order = 6;
    }

    return data;
  }

  const VERSION_CONFIGS = [
    {
      id: 'ai-native-business-tool',
      name: 'AI 开发',
      jobTarget: '',
      keywords: ['AI 开发', 'Java', 'Python', '企业工具', '业务流', 'Spring Boot', 'LLM API', '结构化输出', 'Docker Compose', '问题排查'],
      note: '岗位定向：突出 AI 工具应用、企业业务开发、Java/Python、完整交付和主动排障。',
      gap: '暂无公开部署链接，不虚构线上指标；可提供本地演示、Docker Compose 启动说明和当前简历工具成品。',
      themeColor: '#2924c7',
      fontSize: 14,
      lineHeight: 1.35,
      skills: [
        skill('ant-s1', 'AI 开发', '能够使用 Codex、Claude Code 等 AI 开发工具辅助编程、调试、测试与资料整理，也会使用 ChatGPT、Claude 等模型帮助分析问题，并结合实际运行结果进行检查和调整。'),
        skill('ant-s2', 'Java / Python', '以 Java 17、Spring Boot 为主完成 RESTful API、权限和业务逻辑；能够使用 Python、FastAPI、Pydantic 组织 AI 应用接口。'),
        skill('ant-s3', '企业业务流', '能够将需求拆分为数据模型、角色权限、状态流转、操作日志和异常分支，实践事务、幂等、数据归属与流程追溯。'),
        skill('ant-s4', 'AI 应用工程', '实践 OpenAI 兼容 API、Prompt、结构化 JSON、RAG、SSE、超时/异常处理和规则降级，关注可解释与可用性。'),
        skill('ant-s5', '全栈与部署', '掌握 MySQL、Redis、HTML/CSS/JavaScript、Vue 3 基础，熟悉 Git、Swagger/OpenAPI、Docker Compose、Linux 常用命令与联调排查。')
      ],
      projects: [mallBusinessProject],
      summaryTitle: '自我介绍',
      summary: '对 AI 应用有较强兴趣，能够使用 Codex、Claude Code 等 AI 开发工具辅助编程、调试和资料整理，并了解 ChatGPT、Claude 等大模型的基本使用。学习能力强，愿意持续了解 AI 技术并将其应用到实际项目中。'
    },

    {
      id: 'product-manager',
      name: '产品经理 / 产品助理',
      jobTarget: '产品助理 / 产品经理',
      keywords: ['需求分析', '业务流程', 'PRD', '原型设计', '产品验收', 'B 端产品', 'AI 应用', '用户反馈', '项目协作'],
      note: '通用产品方向：突出需求梳理、流程设计、PRD/原型、AI 应用理解与研发测试协作，适合产品助理、企业数字化和技术产品岗位。',
      gap: '产品工具与作品集仍需持续补强；投递前应准备可展示的流程图、原型和需求文档，不虚构用户规模或上线指标。',
      themeColor: '#0f766e',
      fontSize: 12.5,
      lineHeight: 1.28,
      spacingScale: 0.7,
      skills: [
        skill('product-s1', '产品规划与需求分析', '能够从用户场景、业务目标和产品定位出发，拆解用户角色、核心问题、功能范围和需求优先级，明确 MVP 边界并形成结构化产品方案。'),
        skill('product-s2', '用户研究与竞品分析', '能够基于用户场景、反馈信息和竞品体验，识别用户痛点、流程问题和产品机会，整理需求池、问题清单及竞品分析结论。'),
        skill('product-s3', 'PRD、流程与原型设计', '能够设计信息架构、业务流程、状态流转、权限规则和异常分支，输出 PRD、流程图、页面原型、字段说明、交互规则及功能验收清单。'),
        skill('product-s4', 'AI 产品设计与效果评估', '了解大模型、Prompt、RAG、Agent 等应用模式，能够拆解 AI 使用场景，设计结构化输入输出、人工确认和失败降级方案，并围绕准确性、来源匹配、回答完整性和问题解决程度制定体验验收维度。'),
        skill('product-s5', '数据分析与产研协作', '能够使用 Excel 和基础 SQL 进行数据核对，围绕漏斗、转化、趋势和薄弱项梳理指标口径；了解 API、数据库及前后端协作基本概念，能够与研发、测试沟通实现边界并跟进联调、验收和版本迭代。')
      ],
      experiences: [],
      projects: [productCollaborationPlatform, productAiKnowledgeAssistant],
      summaryTitle: '自我评价',
      summary: '具备较好的逻辑分析、问题拆解和文档表达能力，能够从用户场景、业务流程和落地成本等角度理解需求。对 AI 应用、企业服务和协同工具保持持续兴趣，愿意在产品实践中不断完善需求设计、沟通协作和项目推进能力。'
    },

    {
      id: 'java-backend',
      name: 'Java 后端',
      jobTarget: 'Java 后端开发工程师',
      keywords: ['Java', 'Spring Boot', 'Spring Security', 'MyBatis-Plus', 'MySQL', 'Redis', 'RabbitMQ', 'JWT', 'RESTful API', '事务', '状态机', '幂等', 'JUnit 5', 'Docker Compose'],
      note: 'BOSS 定向：以票务选座为主线，突出并发锁座、事务、缓存、状态机、幂等、延迟消息与测试。',
      gap: '票务项目须在完成场次、锁座、延迟释放等核心链路后再用于投递；不虚构高并发规模、线上指标或生产环境经历。',
      fontSize: 12.5,
      lineHeight: 1.27,
      spacingScale: 0.55,
      skills: [
        skill('java-s1', 'Java 基础', '熟悉面向对象、泛型及常用集合框架，理解 HashMap 底层结构与扩容机制、ArrayList 扩容及 equals/hashCode 使用规范。'),
        skill('java-s2', 'Java 并发', '了解线程池核心参数与任务执行流程，理解 synchronized、volatile、ReentrantLock 的基本原理与适用场景。'),
        skill('java-s3', 'JVM', '了解 JVM 内存区域、类加载机制与双亲委派模型，了解常见垃圾回收算法及 G1 收集器基本特点。'),
        skill('java-s4', 'MySQL', '熟悉表结构设计、事务和索引优化，理解 InnoDB B+树索引、联合索引与最左前缀、事务隔离级别及 MVCC，能够使用 EXPLAIN 分析 SQL 执行计划。'),
        skill('java-s5', 'Redis', '熟悉常用数据结构、过期策略和内存淘汰机制，能够使用 Redis 实现业务缓存与访问频控，了解缓存穿透、击穿及缓存一致性的常见处理方案。'),
        skill('java-s6', 'Spring 生态', '熟悉 Spring Boot、Spring MVC、Spring Security 和 MyBatis-Plus，能够开发包含鉴权、参数校验、异常处理和事务控制的 RESTful 服务，了解 IoC、AOP 和自动装配原理。'),
        skill('java-s7', 'RabbitMQ', '熟悉交换机、手动 ACK、TTL 与死信队列，能够实现延迟消息，并通过业务唯一键和状态校验处理重复消费。'),
        skill('java-s8', '工程实践', '能够使用 Maven、Git、JUnit 5、Mockito、MockMvc 和 Docker Compose 完成本地开发、接口测试与环境联调，熟悉 Linux 常用命令。')
      ],
      experienceTitle: '实习经历',
      experiences: [contractCollectionInternship],
      projects: [cinemaTicketingSystem],
      summaryVisible: false,
      summary: '学习能力与抗压能力较强，具备良好的逻辑思维和问题分析能力，能够较快理解业务需求并拆解为可执行的任务。做事认真负责，遇到问题能够主动沟通、定位并推进解决，愿意在项目实践中持续提升自身能力。'
    },
    {
      id: 'software-testing',
      name: '软件测试 / 测试开发',
      jobTarget: '软件测试 / 测试开发工程师',
      keywords: ['测试用例', '接口测试', 'JUnit 5', 'Mockito', 'MockMvc', 'MySQL', 'Linux', 'Java'],
      note: 'BOSS 定向：突出测试设计、接口验证、自动化测试、SQL/Linux 与能读代码定位问题的开发基础。',
      gap: '未虚构 Selenium、JMeter 和企业缺陷平台经验；这些已列入后续补强，而非写入简历。',
      themeColor: '#0f766e',
      skills: [
        skill('qa-s1', '测试设计', '能够根据需求和业务流程设计功能、场景、边界与异常用例，关注权限、状态流转、重复提交和数据一致性。'),
        skill('qa-s2', '接口测试', '熟悉 HTTP/REST、状态码、JSON 与 JWT，能结合 Swagger/OpenAPI、浏览器网络请求和数据库记录验证接口。'),
        skill('qa-s3', '自动化测试', '使用 JUnit 5、Mockito、MockMvc、Spring Boot Test 与 H2 编写单元和接口测试，工作区项目累计包含 30+ 个测试用例。'),
        skill('qa-s4', '数据库与环境', '熟悉 MySQL 基础 SQL、表结构和事务；能够使用 Maven、Git、Linux 常用命令和日志进行环境与问题排查。'),
        skill('qa-s5', '开发基础', '具备 Java、Spring Boot、MyBatis-Plus 基础，可阅读后端代码并围绕鉴权、状态机、Prompt 和 RAG 算法设计测试。')
      ],
      projects: [externalProjects.testing],
      summary: '做事认真细致，具备较强的问题意识和逻辑分析能力，能够根据需求梳理场景、发现边界问题并推动闭环。遇到异常能够耐心复现、沟通和跟进验证。'
    },
    {
      id: 'ai-application',
      name: 'AI 应用 / Agent 方向',
      jobTarget: 'AI 应用开发工程师（Agent / RAG 方向）',
      keywords: ['LLM API', 'Agent', 'LangGraph', 'RAG', 'Prompt', 'Embedding', '混合检索', '结构化输出', 'SSE', 'FastAPI'],
      note: '定位 AI 应用开发而非算法岗，突出模型接入、Agent 工作流、RAG、工具调用、流式交互与异常兜底。',
      gap: '项目内容需与代码、演示和面试讲解保持一致，不填写无法验证的线上指标。',
      themeColor: '#7c3aed',
      fontSize: 13.5,
      lineHeight: 1.3,
      skills: [
        skill('ai-s1', '模型与接口', '熟悉 OpenAI 兼容 API 调用方式，能够接入 DeepSeek，并处理模型配置、超时、错误响应和调用降级。'),
        skill('ai-s2', 'Agent 开发', '了解 LangGraph 状态图、条件路由、工具注册和上下文管理，能够使用 FastAPI、Pydantic 组织 Agent 接口与数据结构。'),
        skill('ai-s3', 'RAG 应用', '掌握文档切片、Embedding、向量存储、TopK 召回、关键词混合排序、上下文拼接和回答来源展示。'),
        skill('ai-s4', 'Prompt 与输出', '能够设计任务说明、上下文约束和 JSON 输出格式，并进行响应解析、字段校验、长度控制与异常处理。'),
        skill('ai-s5', '工程与交互', '实践 SSE 流式输出、会话状态、任务进度、重试、人工确认、Mock/规则兜底和用户反馈闭环。'),
        skill('ai-s6', '开发与验证', '能够使用 Python、Java、Spring Boot、MySQL、JUnit 5、Docker 和 Git 完成 AI 应用开发、测试与本地部署。')
      ],
      projects: [aiAgentPortfolio, campusKnowledge.ai],
      summaryTitle: '自我介绍',
      summary: '对 AI 应用开发保持持续兴趣，能够使用 Codex、Claude Code 等 AI 工具辅助编程和调试，并了解 DeepSeek 模型的基本使用。愿意在项目中持续学习和完善应用效果。'
    },
  ];

  const RESUME_VERSION_LIBRARY = VERSION_CONFIGS.map((config) => ({
    id: config.id,
    name: config.name,
    jobTarget: config.jobTarget,
    keywords: config.keywords,
    note: config.note,
    gap: config.gap,
    data: createResume(config)
  }));

  let memoryStore = null;
  let memoryActiveId = DEFAULT_ACTIVE_VERSION_ID;

  function readStore() {
    try {
      const raw = localStorage.getItem(VERSION_STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.versions) return parsed;
      }
    } catch (error) {
      console.warn('读取多版本简历失败，使用内存数据：', error);
    }
    if (!memoryStore) {
      memoryStore = { schemaVersion: STORE_SCHEMA_VERSION, versions: {} };
    }
    return memoryStore;
  }

  function writeStore(store) {
    memoryStore = store;
    try {
      localStorage.setItem(VERSION_STORE_KEY, JSON.stringify(store));
      return true;
    } catch (error) {
      console.error('保存多版本简历失败：', error);
      return false;
    }
  }

  function hasVersion(id) {
    return id === ORIGINAL_VERSION_ID || RESUME_VERSION_LIBRARY.some((item) => item.id === id);
  }

  function getBuiltIn(id) {
    return RESUME_VERSION_LIBRARY.find((item) => item.id === id) || null;
  }

  function initialize(legacyData) {
    const store = readStore();
    store.schemaVersion = STORE_SCHEMA_VERSION;
    store.versions = store.versions || {};

    if (!store.versions[ORIGINAL_VERSION_ID]) {
      store.versions[ORIGINAL_VERSION_ID] = clone(legacyData || window.SAMPLE_DATA);
    }

    RESUME_VERSION_LIBRARY.forEach((item) => {
      if (!store.versions[item.id]) {
        store.versions[item.id] = clone(item.data);
      }
    });

    writeStore(store);

    let activeId = null;
    try {
      activeId = localStorage.getItem(ACTIVE_VERSION_KEY);
    } catch (error) {
      activeId = memoryActiveId;
    }
    if (!hasVersion(activeId)) {
      setActiveId(DEFAULT_ACTIVE_VERSION_ID);
    } else {
      memoryActiveId = activeId;
    }
  }

  function list() {
    const builtIns = RESUME_VERSION_LIBRARY.map((item) => ({
      id: item.id,
      name: item.name,
      jobTarget: item.jobTarget,
      keywords: [...item.keywords],
      note: item.note,
      gap: item.gap,
      builtIn: true
    }));
    builtIns.push({
      id: ORIGINAL_VERSION_ID,
      name: '原始默认简历（备份）',
      jobTarget: window.SAMPLE_DATA.basicInfo.jobTarget,
      keywords: [],
      note: '保留更新前的默认简历内容，便于对照和恢复个人资料。',
      gap: '',
      builtIn: false
    });
    return builtIns;
  }

  function getActiveId() {
    try {
      const stored = localStorage.getItem(ACTIVE_VERSION_KEY);
      if (hasVersion(stored)) return stored;
    } catch (error) {
      // Ignore and use memory value.
    }
    return hasVersion(memoryActiveId) ? memoryActiveId : DEFAULT_ACTIVE_VERSION_ID;
  }

  function setActiveId(id) {
    if (!hasVersion(id)) return false;
    memoryActiveId = id;
    try {
      localStorage.setItem(ACTIVE_VERSION_KEY, id);
    } catch (error) {
      console.warn('保存当前简历版本失败：', error);
    }
    return true;
  }

  function load(id = getActiveId()) {
    const store = readStore();
    const storedData = store.versions?.[id];
    if (storedData) return clone(storedData);
    if (id === ORIGINAL_VERSION_ID) return clone(window.SAMPLE_DATA);
    const builtIn = getBuiltIn(id);
    return clone(builtIn ? builtIn.data : window.SAMPLE_DATA);
  }

  function save(id, data) {
    if (!hasVersion(id) || !data) return false;
    const store = readStore();
    store.versions = store.versions || {};
    store.versions[id] = clone(data);
    const ok = writeStore(store);
    if (id === ORIGINAL_VERSION_ID) {
      ResumeStorage.save(data);
    }
    return ok;
  }

  function saveActive(data) {
    return save(getActiveId(), data);
  }

  function resetActive() {
    const id = getActiveId();
    const source = id === ORIGINAL_VERSION_ID
      ? window.SAMPLE_DATA
      : (getBuiltIn(id)?.data || window.SAMPLE_DATA);
    const resetData = clone(source);
    save(id, resetData);
    return resetData;
  }

  function getMetadata(id = getActiveId()) {
    return list().find((item) => item.id === id) || null;
  }

  window.RESUME_VERSION_LIBRARY = RESUME_VERSION_LIBRARY;
  window.ResumeVersions = {
    initialize,
    list,
    load,
    save,
    saveActive,
    resetActive,
    getActiveId,
    setActiveId,
    getMetadata,
    ORIGINAL_VERSION_ID,
    DEFAULT_ACTIVE_VERSION_ID
  };
})();
