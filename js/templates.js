/**
 * templates.js - 简历模板渲染模块
 * 提供 modern / classic / academic 三种模板的 HTML 生成
 */

const ResumeTemplates = (() => {
  // ============================================================
  // SVG 图标集合
  // ============================================================
  const ICONS = {
    phone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    email: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    website: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    education: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>`,
    work: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    project: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
    skills: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    award: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    cert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/><circle cx="16" cy="16" r="2"/><path d="M16 14v-2"/></svg>`,
    summary: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  };

  // ============================================================
  // 工具函数
  // ============================================================

  /** 日期格式化：'2025-06' → '2025.06' */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '.');
  }

  /** 描述文本拆分为列表项 */
  function descriptionToList(text) {
    if (!text) return [];
    return text.split('\n').map((line) => line.trim()).filter(Boolean);
  }

  /** HTML 转义 */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** HTML 转义 + 简易 Markdown 解析 (支持 **加粗** 和 [链接](url)) */
  function parseMarkdown(str) {
    if (!str) return '';
    let html = escapeHTML(str);
    // 解析 **加粗**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 解析 [链接](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return html;
  }

  /** 获取板块图标 SVG */
  function getSectionIcon(iconName) {
    return ICONS[iconName] || ICONS.summary;
  }


  /** 统一渲染求职岗位，避免数据中已有前缀时重复显示 */
  function renderJobTarget(jobTarget) {
    const normalized = String(jobTarget || '')
      .trim()
      .replace(/^求职(?:岗位|意向|目标)\s*[：:]\s*/, '');
    return normalized
      ? `<div class="resume-job-target">求职岗位：${escapeHTML(normalized)}</div>`
      : '';
  }

  /** 技能等级映射 */
  function skillLevelWidth(level) {
    const map = { expert: '100%', proficient: '75%', familiar: '45%' };
    return map[level] || '50%';
  }

  function skillLevelLabel(level) {
    const map = { expert: '精通', proficient: '熟练', familiar: '了解' };
    return map[level] || level;
  }

  // ============================================================
  // 通用渲染器
  // ============================================================

  /** 渲染头部（姓名、联系方式、求职岗位、照片） */
  function renderHeader(basicInfo, options = {}) {
    const { layout = 'center' } = options;
    const contactItems = [];

    if (basicInfo.phone) {
      contactItems.push(`<span class="resume-contact-item">${ICONS.phone}<span>${escapeHTML(basicInfo.phone)}</span></span>`);
    }
    if (basicInfo.email) {
      contactItems.push(`<span class="resume-contact-item">${ICONS.email}<span>${escapeHTML(basicInfo.email)}</span></span>`);
    }
    if (basicInfo.birthDate) {
      contactItems.push(`<span class="resume-contact-item"><span>${escapeHTML(basicInfo.birthDate)}</span></span>`);
    }
    if (basicInfo.hometown) {
      contactItems.push(`<span class="resume-contact-item"><span>${escapeHTML(basicInfo.hometown)}</span></span>`);
    }
    if (basicInfo.gradSchool) {
      contactItems.push(`<span class="resume-contact-item"><span>${escapeHTML(basicInfo.gradSchool)}</span></span>`);
    }
    if (basicInfo.website) {
      contactItems.push(`<span class="resume-contact-item">${ICONS.website}<span>${escapeHTML(basicInfo.website)}</span></span>`);
    }

    const photoHTML = basicInfo.photo
      ? `<div class="resume-photo"><img src="${basicInfo.photo}" alt="照片" /></div>`
      : '';

    return `
      <div class="resume-header resume-header--${layout}">
        ${photoHTML}
        <div class="resume-header-info">
          <h1 class="resume-name">${escapeHTML(basicInfo.name)}</h1>
          ${renderJobTarget(basicInfo.jobTarget)}
          <div class="resume-contact">${contactItems.join('')}</div>
        </div>
      </div>
    `;
  }

  /** 渲染教育背景 */
  function renderEducation(items) {
    return items.map((item) => {
      const f = item.fields;
      const dateRange = `${formatDate(f.startDate)} - ${formatDate(f.endDate)}`;
      const metaParts = [f.degree, f.major].filter(Boolean).join(' · ');
      const gpaPart = f.gpa ? `<span class="resume-item-gpa">GPA: ${escapeHTML(f.gpa)}</span>` : '';
      const coursesPart = f.courses ? `<div class="resume-item-meta">核心课程：${escapeHTML(f.courses)}</div>` : '';

      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${escapeHTML(f.school)}</span>
            <span class="resume-item-date">${dateRange}</span>
          </div>
          <div class="resume-item-subtitle">${escapeHTML(metaParts)} ${gpaPart}</div>
          ${coursesPart}
        </div>
      `;
    }).join('');
  }

  /** 渲染工作/实习经历 */
  function renderExperience(items) {
    return items.map((item) => {
      const f = item.fields;
      const dateRange = `${formatDate(f.startDate)} - ${formatDate(f.endDate)}`;
      const bullets = descriptionToList(f.description);
      const descHTML = bullets.length
        ? `<div class="resume-item-description"><ul>${bullets.map((b) => `<li>${parseMarkdown(b)}</li>`).join('')}</ul></div>`
        : '';
      const techHTML = f.techStack
        ? `<div class="resume-item-meta">技术栈：${escapeHTML(f.techStack)}</div>`
        : '';
      const summaryHTML = f.summary
        ? `<div class="resume-project-intro">项目简介：${escapeHTML(f.summary)}</div>`
        : '';

      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${escapeHTML(f.company)}</span>
            <span class="resume-item-date">${dateRange}</span>
          </div>
          <div class="resume-item-subtitle">${escapeHTML(f.position)}</div>
          ${techHTML}
          ${summaryHTML}
          ${descHTML}
        </div>
      `;
    }).join('');
  }

  /** 渲染项目经历 */
  function renderProjects(items) {
    return items.map((item) => {
      const f = item.fields;
      const dateRange = `${formatDate(f.startDate)} - ${formatDate(f.endDate)}`;
      const bullets = descriptionToList(f.description);
      const descHTML = bullets.length
        ? `<div class="resume-item-description"><ul>${bullets.map((b) => `<li>${parseMarkdown(b)}</li>`).join('')}</ul></div>`
        : '';
      const techHTML = f.techStack ? `<div class="resume-item-meta">技术栈：${escapeHTML(f.techStack)}</div>` : '';

      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${escapeHTML(f.name)}</span>
            <span class="resume-item-date">${dateRange}</span>
          </div>
          ${f.role ? `<div class="resume-item-subtitle">${escapeHTML(f.role)}</div>` : ''}
          ${techHTML}
          ${descHTML}
        </div>
      `;
    }).join('');
  }

  /** 渲染技能清单 */
  function renderSkills(items) {
    const hasDescription = items.some((item) => item.fields.description);

    if (hasDescription) {
      const skillsHTML = items.map((item) => {
        const f = item.fields;
        return `
          <div class="resume-skill-bullet" style="margin-bottom: 6px; font-size: calc(var(--resume-font-size) * 0.92); line-height: var(--resume-line-height);">
            <strong>${escapeHTML(f.name)}：</strong>
            <span>${parseMarkdown(f.description || '')}</span>
          </div>
        `;
      }).join('');
      return `<div class="resume-skills-text-list">${skillsHTML}</div>`;
    }

    const skillsHTML = items.map((item) => {
      const f = item.fields;
      return `
        <div class="resume-skill-item">
          <span class="resume-skill-name">${escapeHTML(f.name)}</span>
          <span class="resume-skill-level" title="${skillLevelLabel(f.level)}">
            <span class="resume-skill-level-fill" data-level="${f.level}" style="width: ${skillLevelWidth(f.level)}"></span>
          </span>
        </div>
      `;
    }).join('');

    return `<div class="resume-skills-grid">${skillsHTML}</div>`;
  }

  /** 渲染竞赛与荣誉 */
  function renderAwards(items) {
    return items.map((item) => {
      const f = item.fields;
      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${escapeHTML(f.name)}</span>
            <span class="resume-item-date">${escapeHTML(f.date || '')}</span>
          </div>
          <div class="resume-item-subtitle">${escapeHTML(f.level || '')}</div>
        </div>
      `;
    }).join('');
  }

  /** 渲染证书资质 */
  function renderCertificates(items) {
    return items.map((item) => {
      const f = item.fields;
      const parts = [f.issuer, f.date].filter(Boolean).join(' · ');
      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <span class="resume-item-title">${escapeHTML(f.name)}</span>
            <span class="resume-item-date">${escapeHTML(f.date || '')}</span>
          </div>
          ${f.issuer ? `<div class="resume-item-subtitle">${escapeHTML(f.issuer)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /** 渲染自我评价 */
  function renderSummary(content) {
    return `<p class="resume-summary-text">${parseMarkdown(content || '')}</p>`;
  }

  /** 渲染自定义列表型板块 */
  function renderCustomList(items) {
    return items.map((item) => {
      const f = item.fields;
      const dateRange = (f.startDate || f.endDate) ? `${formatDate(f.startDate)} - ${formatDate(f.endDate)}` : '';
      const bullets = descriptionToList(f.description);
      const descHTML = bullets.length
        ? `<div class="resume-item-description"><ul>${bullets.map((b) => `<li>${parseMarkdown(b)}</li>`).join('')}</ul></div>`
        : '';

      return `
        <div class="resume-item">
          <div class="resume-item-header">
            <strong class="resume-item-title">${escapeHTML(f.title || f.name || '')}</strong>
            <span class="resume-item-date">${dateRange}</span>
          </div>
          ${(f.subtitle || f.role) ? `<div class="resume-item-subtitle">${escapeHTML(f.subtitle || f.role)}</div>` : ''}
          ${descHTML}
        </div>
      `;
    }).join('');
  }

  /** 根据板块 id 分发渲染 */
  function renderSectionContent(section) {
    if (section.id === 'summary' || section.type === 'text') {
      return renderSummary(section.content);
    }

    const items = section.items || [];
    if (items.length === 0) return '<p style="color:#999;font-style:italic;">暂无内容</p>';

    switch (section.id) {
      case 'education':
        return renderEducation(items);
      case 'experience':
        return renderExperience(items);
      case 'projects':
        return renderProjects(items);
      case 'skills':
        return renderSkills(items);
      case 'awards':
        return renderAwards(items);
      case 'certificates':
        return renderCertificates(items);
      default:
        if (section.id.startsWith('custom-') || section.type === 'list') {
          return renderCustomList(items);
        }
        return '';
    }
  }

  /** 渲染单个板块 */
  function renderSection(section) {
    if (!section.visible) return '';

    return `
      <div class="resume-section" data-section="${section.id}">
        <div class="resume-section-title">
          <span class="resume-section-icon">${getSectionIcon(section.icon)}</span>
          <span>${escapeHTML(section.customTitle || section.title)}</span>
        </div>
        ${renderSectionContent(section)}
      </div>
    `;
  }

  // ============================================================
  // Modern 模板
  // ============================================================
  function modern(data) {
    const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
    const sectionsHTML = sortedSections.map((s) => renderSection(s)).join('');

    return `
      <div class="resume-page">
        ${renderHeader(data.basicInfo, { layout: 'center' })}
        <div class="resume-body">
          ${sectionsHTML}
        </div>
      </div>
    `;
  }

  // ============================================================
  // Classic 模板（双栏布局）
  // ============================================================
  function classic(data) {
    const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);

    // 侧边栏板块
    const sidebarIds = new Set(['skills', 'certificates']);
    const sidebarSections = sortedSections.filter((s) => sidebarIds.has(s.id));
    const mainSections = sortedSections.filter((s) => !sidebarIds.has(s.id));

    // 侧边栏联系信息
    const contactItems = [];
    const bi = data.basicInfo;
    if (bi.phone) contactItems.push(`<div class="resume-contact-item">${ICONS.phone}<span>${escapeHTML(bi.phone)}</span></div>`);
    if (bi.email) contactItems.push(`<div class="resume-contact-item">${ICONS.email}<span>${escapeHTML(bi.email)}</span></div>`);
    if (bi.birthDate) contactItems.push(`<div class="resume-contact-item"><span>生日：${escapeHTML(bi.birthDate)}</span></div>`);
    if (bi.hometown) contactItems.push(`<div class="resume-contact-item"><span>籍贯：${escapeHTML(bi.hometown)}</span></div>`);
    if (bi.gradSchool) contactItems.push(`<div class="resume-contact-item"><span>院校：${escapeHTML(bi.gradSchool)}</span></div>`);
    if (bi.website) contactItems.push(`<div class="resume-contact-item">${ICONS.website}<span>${escapeHTML(bi.website)}</span></div>`);

    const photoHTML = bi.photo
      ? `<div class="resume-photo"><img src="${bi.photo}" alt="照片" /></div>`
      : `<div class="resume-photo resume-photo--placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="placeholder-text">暂无照片</span></div>`;

    const sidebarHTML = `
      <div class="resume-sidebar">
        ${photoHTML}
        <div class="resume-sidebar-section">
          <div class="resume-section-title">
            <span class="resume-section-icon">${ICONS.phone}</span>
            <span>联系方式</span>
          </div>
          <div class="resume-sidebar-contact">${contactItems.join('')}</div>
        </div>
        ${sidebarSections.map((s) => renderSection(s)).join('')}
      </div>
    `;

    const mainHTML = `
      <div class="resume-main">
        <div class="resume-header resume-header--left">
          <div class="resume-header-info">
            <h1 class="resume-name">${escapeHTML(bi.name)}</h1>
            ${renderJobTarget(bi.jobTarget)}
          </div>
        </div>
        <div class="resume-body">
          ${mainSections.map((s) => renderSection(s)).join('')}
        </div>
      </div>
    `;

    return `
      <div class="resume-page resume-page--classic">
        ${sidebarHTML}
        ${mainHTML}
      </div>
    `;
  }

  // ============================================================
  // Academic 模板
  // ============================================================
  function academic(data) {
    const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
    const sectionsHTML = sortedSections.map((s) => renderSection(s)).join('');

    return `
      <div class="resume-page">
        ${renderHeader(data.basicInfo, { layout: 'left' })}
        <div class="resume-body">
          ${sectionsHTML}
        </div>
      </div>
    `;
  }

  // ============================================================
  // Classic-ZH 模板 (经典蓝黑，适配中国校招审美)
  // ============================================================
  function classicZH(data) {
    const sortedSections = [...data.sections].sort((a, b) => a.order - b.order);
    
    // Header rendering specific to classic-zh
    const bi = data.basicInfo;
    const contactItems = [];
    if (bi.phone) contactItems.push(`<div class="resume-contact-item">${ICONS.phone}<span>电话：${escapeHTML(bi.phone)}</span></div>`);
    if (bi.email) contactItems.push(`<div class="resume-contact-item">${ICONS.email}<span>邮箱：${escapeHTML(bi.email)}</span></div>`);
    if (bi.birthDate) contactItems.push(`<div class="resume-contact-item"><span>出生年月：${escapeHTML(bi.birthDate)}</span></div>`);
    if (bi.hometown) contactItems.push(`<div class="resume-contact-item"><span>籍贯：${escapeHTML(bi.hometown)}</span></div>`);
    if (bi.gradSchool) contactItems.push(`<div class="resume-contact-item"><span>毕业院校：${escapeHTML(bi.gradSchool)}</span></div>`);
    if (bi.website) contactItems.push(`<div class="resume-contact-item">${ICONS.website}<span>${escapeHTML(bi.website)}</span></div>`);

    const photoHTML = bi.photo
      ? `<div class="resume-photo"><img src="${bi.photo}" alt="照片" /></div>`
      : '';

    const headerHTML = `
      <div class="resume-header resume-header--classic-zh">
        <div class="resume-header-info">
          <h1 class="resume-name">${escapeHTML(bi.name)}</h1>
          ${renderJobTarget(bi.jobTarget)}
          <div class="resume-contact-grid">${contactItems.join('')}</div>
        </div>
        ${photoHTML}
      </div>
    `;

    // Specialized section rendering for classic-zh
    const sectionsHTML = sortedSections.map((s) => {
      if (!s.visible) return '';
      
      let contentHTML = '';
      if (s.id === 'skills') {
        // Render skills as bullets with bold titles instead of progress bars
        const items = s.items || [];
        contentHTML = items.map((item) => {
          const f = item.fields;
          return `
            <div class="resume-skill-bullet">
              <strong>${escapeHTML(f.name)}：</strong>
              <span>${parseMarkdown(f.description || '')}</span>
            </div>
          `;
        }).join('');
      } else if (s.id === 'projects') {
        // Render project name, role, tech stack all in a bold header line
        const items = s.items || [];
        contentHTML = items.map((item) => {
          const f = item.fields;
          const dateRange = f.startDate ? `${formatDate(f.startDate)} - ${formatDate(f.endDate)}` : '';
          
          // Parse project description for intro vs bullets
          const bullets = descriptionToList(f.description);
          let introHTML = '';
          let bulletsList = [];
          
          bullets.forEach((line, idx) => {
            if (idx === 0 && (line.startsWith('项目简介：') || line.startsWith('项目介绍：') || (!line.startsWith('负责') && !line.startsWith('使用') && !line.startsWith('参与')))) {
              introHTML = `<div class="resume-project-intro">${escapeHTML(line)}</div>`;
            } else {
              bulletsList.push(line);
            }
          });
          
          const bulletsHTML = bulletsList.length
            ? `<ul class="resume-project-bullets">${bulletsList.map((b) => `<li>${parseMarkdown(b)}</li>`).join('')}</ul>`
            : '';
          const role = String(f.role || '').trim();
          const techStack = String(f.techStack || '').trim();
          const titleParts = [
            `<strong>${escapeHTML(f.name || '')}</strong>`,
            role ? `<span>${escapeHTML(role)}</span>` : '',
            role && techStack ? `<span>${escapeHTML(techStack)}</span>` : ''
          ].filter(Boolean);
          const techStackHTML = !role && techStack
            ? `<div class="resume-item-meta">${escapeHTML(techStack)}</div>`
            : '';

          return `
            <div class="resume-project-item">
              <div class="resume-item-header">
                <div class="resume-item-title-group">
                  ${titleParts.join(' | ')}
                </div>
                ${dateRange ? `<span class="resume-item-date">${dateRange}</span>` : ''}
              </div>
              ${techStackHTML}
              ${introHTML}
              ${bulletsHTML}
            </div>
          `;
        }).join('');
      } else if (s.id === 'education') {
        // Education render
        const items = s.items || [];
        contentHTML = items.map((item) => {
          const f = item.fields;
          const dateRange = `${formatDate(f.startDate)} - ${formatDate(f.endDate)}`;
          const metaParts = [f.major, f.degree, f.gpa ? `绩点 ${f.gpa}` : ''].filter(Boolean).join(' | ');
          const coursesPart = f.courses ? `<div class="resume-education-courses">主修课程为 ${escapeHTML(f.courses)}。</div>` : '';

          return `
            <div class="resume-education-item">
              <div class="resume-item-header">
                <strong>${dateRange}</strong>
                <strong class="school-name">${escapeHTML(f.school)}</strong>
              </div>
              <div class="resume-education-meta">${escapeHTML(metaParts)}</div>
              ${coursesPart}
            </div>
          `;
        }).join('');
      } else if (s.id === 'certificates') {
        // Certificates rendering in "Name: Issuer" bullet style
        const items = s.items || [];
        contentHTML = `<ul class="resume-bullets-list">` + items.map((item) => {
          const f = item.fields;
          const descStr = f.issuer ? `：${f.issuer}` : '';
          const dateStr = f.date ? `（${formatDate(f.date)}）` : '';
          return `<li><strong>${escapeHTML(f.name)}</strong>${escapeHTML(descStr)}${escapeHTML(dateStr)}</li>`;
        }).join('') + `</ul>`;
      } else if (s.id === 'awards') {
        // Awards rendering in similar bullet style
        const items = s.items || [];
        contentHTML = `<ul class="resume-bullets-list">` + items.map((item) => {
          const f = item.fields;
          const descStr = f.level ? `：${f.level}` : '';
          const dateStr = f.date ? `（${formatDate(f.date)}）` : '';
          return `<li><strong>${escapeHTML(f.name)}</strong>${escapeHTML(descStr)}${escapeHTML(dateStr)}</li>`;
        }).join('') + `</ul>`;
      } else {
        // Default section content renderer
        contentHTML = renderSectionContent(s);
      }

      return `
        <div class="resume-section" data-section="${s.id}">
          <div class="resume-section-title">
            <span class="resume-section-icon">${getSectionIcon(s.icon)}</span>
            <span class="resume-section-title-text">${escapeHTML(s.customTitle || s.title)}</span>
          </div>
          <div class="resume-section-body">
            ${contentHTML}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="resume-page resume-page--classic-zh">
        ${headerHTML}
        <div class="resume-body">
          ${sectionsHTML}
        </div>
      </div>
    `;
  }

  // ============================================================
  // 主渲染入口
  // ============================================================
  function render(data) {
    const templateName = data.meta?.template || 'modern';
    switch (templateName) {
      case 'classic-zh':
        return classicZH(data);
      case 'classic':
        return classic(data);
      case 'academic':
        return academic(data);
      case 'modern':
      default:
        return modern(data);
    }
  }

  return { render, modern, classic, academic, classicZH };
})();

// 挂载到全局
window.ResumeTemplates = ResumeTemplates;
