/**
 * editor.js - 编辑器面板模块
 * 负责左侧编辑区的渲染、表单交互、数据同步
 */

const ResumeEditor = (() => {
  let _container = null;
  let _data = null;
  let _onChange = null;
  let _debounceTimer = null;

  // ============================================================
  // 工具函数
  // ============================================================

  /** 防抖函数 */
  function debounce(fn, delay = 100) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(fn, delay);
  }

  /** 自动调整 textarea 高度 */
  function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
  }

  /** 通知变更 */
  function notifyChange() {
    if (_onChange && _data) {
      _onChange(deepClone(_data));
    }
  }

  /** 根据板块 ID 查找板块 */
  function findSection(sectionId) {
    return _data.sections.find((s) => s.id === sectionId);
  }

  /** 根据板块 ID 和条目 ID 查找条目 */
  function findItem(sectionId, itemId) {
    const section = findSection(sectionId);
    if (!section || !section.items) return null;
    return section.items.find((it) => it.id === itemId);
  }

  /** 获取板块的字段定义（支持自定义列表板块） */
  function getSectionFields(sectionId) {
    if (window.SECTION_FIELDS[sectionId]) {
      return window.SECTION_FIELDS[sectionId];
    }
    if (sectionId && sectionId.startsWith('custom-')) {
      return [
        { key: 'title', label: '主要名称', type: 'text', placeholder: '如：公司名称、学校名称、项目名称' },
        { key: 'subtitle', label: '辅助名称', type: 'text', placeholder: '如：岗位名称、角色、专业' },
        { key: 'startDate', label: '开始时间', type: 'month' },
        { key: 'endDate', label: '结束时间', type: 'month' },
        { key: 'description', label: '详细描述', type: 'textarea', placeholder: '请详细描述您的职责、工作内容与成果（每行一条）' }
      ];
    }
    return null;
  }

  // ============================================================
  // 编辑器板块图标（与 templates.js 一致）
  // ============================================================
  const EDITOR_ICONS = {
    education: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/></svg>`,
    work: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    project: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
    skills: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    award: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    cert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/><circle cx="16" cy="16" r="2"/><path d="M16 14v-2"/></svg>`,
    summary: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
  };

  // 拖拽手柄图标
  const DRAG_HANDLE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.4"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>`;

  // 折叠箭头
  const COLLAPSE_ARROW = `<svg class="collapse-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  // 删除图标
  const DELETE_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

  // 添加图标
  const ADD_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  // 照片上传图标
  const PHOTO_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

  // ============================================================
  // 表单字段渲染
  // ============================================================

  /** 渲染单个表单字段 */
  function renderField(field, value, sectionId, itemId) {
    const id = `field-${sectionId}-${itemId}-${field.key}`;
    const val = value || '';
    const optionalTag = field.optional ? '<span class="field-optional">选填</span>' : '';

    let inputHTML = '';

    switch (field.type) {
      case 'text':
        inputHTML = `<input type="text" id="${id}" class="editor-input" 
          data-section="${sectionId}" data-item="${itemId}" data-field="${field.key}"
          value="${escapeAttr(val)}" placeholder="${escapeAttr(field.placeholder || '')}" />`;
        break;

      case 'month':
        inputHTML = `<input type="month" id="${id}" class="editor-input" 
          data-section="${sectionId}" data-item="${itemId}" data-field="${field.key}"
          value="${escapeAttr(val)}" />`;
        break;

      case 'textarea':
        inputHTML = `<textarea id="${id}" class="editor-input editor-textarea" rows="4"
          data-section="${sectionId}" data-item="${itemId}" data-field="${field.key}"
          placeholder="${escapeAttr(field.placeholder || '')}">${escapeHTML(val)}</textarea>`;
        break;

      case 'select': {
        const options = field.options.map((opt) => {
          let optVal, optLabel;
          if (Array.isArray(opt)) {
            [optVal, optLabel] = opt;
          } else {
            optVal = opt;
            optLabel = opt;
          }
          const selected = optVal === val ? 'selected' : '';
          return `<option value="${escapeAttr(optVal)}" ${selected}>${escapeHTML(optLabel)}</option>`;
        }).join('');
        inputHTML = `<select id="${id}" class="editor-input editor-select"
          data-section="${sectionId}" data-item="${itemId}" data-field="${field.key}">
          <option value="">请选择</option>${options}</select>`;
        break;
      }

      default:
        inputHTML = `<input type="text" id="${id}" class="editor-input"
          data-section="${sectionId}" data-item="${itemId}" data-field="${field.key}"
          value="${escapeAttr(val)}" />`;
    }

    return `
      <div class="field-group ${field.type === 'month' ? 'field-group--half' : ''}">
        <label class="field-label" for="${id}">${escapeHTML(field.label)} ${optionalTag}</label>
        ${inputHTML}
      </div>
    `;
  }

  /** 属性值转义 */
  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** HTML 转义 */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================================
  // 渲染基本信息板块
  // ============================================================
  function renderBasicInfo(basicInfo) {
    const photoPreview = basicInfo.photo
      ? `<img src="${basicInfo.photo}" alt="照片预览" />`
      : `${PHOTO_ICON}`;

    return `
      <div class="editor-section editor-section--basic" data-section="basicInfo">
        <div class="section-header section-header--basic" data-action="toggle-section" data-section="basicInfo">
          <div class="section-header-left">
            <span class="section-icon">${EDITOR_ICONS.user}</span>
            <span class="section-title">基本信息</span>
          </div>
          <div class="section-header-right">
            ${COLLAPSE_ARROW}
          </div>
        </div>
        <div class="section-content">
          <div class="photo-upload" style="margin-bottom: 20px;">
            <label class="photo-preview" for="photo-upload-input" style="cursor: pointer;">
              ${photoPreview}
            </label>
            <input type="file" id="photo-upload-input" accept="image/*" style="display:none" />
            <div class="photo-actions">
              <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">求职证件照</span>
              ${basicInfo.photo
                ? `<button type="button" class="btn-remove-photo" data-action="remove-photo" style="margin-top: 6px; padding: 4px 10px; font-size: 11px;">移除照片</button>`
                : `<label for="photo-upload-input" style="cursor: pointer; font-size: 12px; color: var(--accent); font-weight: 500; margin-top: 6px; display: inline-block;">点击选择图片</label>`
              }
            </div>
          </div>

          <div class="basic-info-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-name">姓名</label>
              <input type="text" id="basic-name" class="editor-input" data-basic="name"
                value="${escapeAttr(basicInfo.name)}" placeholder="请输入姓名" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-phone">手机号</label>
              <input type="tel" id="basic-phone" class="editor-input" data-basic="phone"
                value="${escapeAttr(basicInfo.phone)}" placeholder="如：138-0000-0000" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-email">邮箱</label>
              <input type="email" id="basic-email" class="editor-input" data-basic="email"
                value="${escapeAttr(basicInfo.email)}" placeholder="如：name@example.com" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-jobTarget">求职岗位</label>
              <input type="text" id="basic-jobTarget" class="editor-input" data-basic="jobTarget"
                value="${escapeAttr(basicInfo.jobTarget)}" placeholder="如：前端开发工程师" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-birthDate">出生年月</label>
              <input type="text" id="basic-birthDate" class="editor-input" data-basic="birthDate"
                value="${escapeAttr(basicInfo.birthDate || '')}" placeholder="如：2000年1月" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="field-label" for="basic-hometown">籍贯</label>
              <input type="text" id="basic-hometown" class="editor-input" data-basic="hometown"
                value="${escapeAttr(basicInfo.hometown || '')}" placeholder="如：中国" />
            </div>
            <div class="form-group" style="grid-column: span 2; margin-bottom: 0;">
              <label class="field-label" for="basic-gradSchool">毕业院校</label>
              <input type="text" id="basic-gradSchool" class="editor-input" data-basic="gradSchool"
                value="${escapeAttr(basicInfo.gradSchool || '')}" placeholder="如：某大学" />
            </div>
            <div class="form-group" style="grid-column: span 2; margin-bottom: 0;">
              <label class="field-label" for="basic-website">个人网站/GitHub (选填)</label>
              <input type="text" id="basic-website" class="editor-input" data-basic="website"
                value="${escapeAttr(basicInfo.website)}" placeholder="如：github.com/username" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // 渲染列表类板块
  // ============================================================
  function renderListSection(section) {
    const fields = getSectionFields(section.id);
    if (!fields) return '';

    const items = section.items || [];
    const itemsHTML = items.map((item, index) => {
      const fieldsHTML = fields.map((f) => renderField(f, item.fields[f.key], section.id, item.id)).join('');

      // 将月份类型字段分组（实现一行两列）
      return `
        <div class="item-card" data-section="${section.id}" data-item="${item.id}">
          <div class="item-card-header">
            <span class="drag-handle" title="拖拽排序">${DRAG_HANDLE_ICON}</span>
            <span class="item-card-title">${getItemTitle(section.id, item)}</span>
            <button class="btn-delete-item" data-action="delete-item" 
              data-section="${section.id}" data-item="${item.id}" title="删除此项">
              ${DELETE_ICON}
            </button>
          </div>
          <div class="item-card-body">
            <div class="fields-grid">
              ${fieldsHTML}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="editor-section" data-section="${section.id}">
        <div class="section-header" data-action="toggle-section" data-section="${section.id}">
          <div class="section-header-left">
            <span class="drag-handle section-drag-handle" title="拖拽排序板块">${DRAG_HANDLE_ICON}</span>
            <span class="section-icon">${EDITOR_ICONS[section.icon] || EDITOR_ICONS.summary}</span>
            <span class="section-title">${escapeHTML(section.customTitle || section.title)}</span>
            <span class="item-count">${items.length}</span>
          </div>
          <div class="section-header-right">
            <label class="visibility-toggle" title="${section.visible ? '隐藏板块' : '显示板块'}">
              <input type="checkbox" class="visibility-checkbox" 
                data-action="toggle-visibility" data-section="${section.id}"
                ${section.visible ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
            ${section.id.startsWith('custom-') ? `
              <button class="btn-delete-section" data-action="delete-section" data-section="${section.id}" title="删除此板块" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; transition: color var(--transition); margin-left: 4px;">
                ${DELETE_ICON}
              </button>
            ` : ''}
            ${COLLAPSE_ARROW}
          </div>
        </div>
        <div class="section-content">
          <div class="form-group section-rename-group" style="margin-bottom: 14px; border-bottom: 1px dashed var(--border-color); padding-bottom: 12px;">
            <label class="field-label" style="font-weight: 600;">板块显示名称</label>
            <input type="text" class="editor-input" data-section-title="${section.id}" value="${escapeAttr(section.customTitle || '')}" placeholder="修改此板块在简历中的标题（如：实习经历）" />
          </div>
          <div class="items-container" data-section="${section.id}">
            ${itemsHTML}
          </div>
          <button class="btn-add-item" data-action="add-item" data-section="${section.id}">
            ${ADD_ICON}
            <span>添加${escapeHTML((section.customTitle || section.title).replace(/[/]/g, ''))}</span>
          </button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // 渲染自我评价板块
  // ============================================================
  function renderSummarySection(section) {
    return `
      <div class="editor-section" data-section="${section.id}">
        <div class="section-header" data-action="toggle-section" data-section="${section.id}">
          <div class="section-header-left">
            <span class="drag-handle section-drag-handle" title="拖拽排序板块">${DRAG_HANDLE_ICON}</span>
            <span class="section-icon">${EDITOR_ICONS[section.icon] || EDITOR_ICONS.summary}</span>
            <span class="section-title">${escapeHTML(section.customTitle || section.title)}</span>
          </div>
          <div class="section-header-right">
            <label class="visibility-toggle" title="${section.visible ? '隐藏板块' : '显示板块'}">
              <input type="checkbox" class="visibility-checkbox"
                data-action="toggle-visibility" data-section="${section.id}"
                ${section.visible ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
            ${section.id.startsWith('custom-') ? `
              <button class="btn-delete-section" data-action="delete-section" data-section="${section.id}" title="删除此板块" style="background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; transition: color var(--transition); margin-left: 4px;">
                ${DELETE_ICON}
              </button>
            ` : ''}
            ${COLLAPSE_ARROW}
          </div>
        </div>
        <div class="section-content">
          <div class="form-group section-rename-group" style="margin-bottom: 14px; border-bottom: 1px dashed var(--border-color); padding-bottom: 12px;">
            <label class="field-label" style="font-weight: 600;">板块显示名称</label>
            <input type="text" class="editor-input" data-section-title="${section.id}" value="${escapeAttr(section.customTitle || '')}" placeholder="修改此板块在简历中的标题（如：自我评价）" />
          </div>
          <div class="field-group">
            <textarea class="editor-input editor-textarea" rows="5"
              data-section="${section.id}" data-field="content"
              placeholder="请输入${escapeHTML(section.customTitle || section.title)}内容...">${escapeHTML(section.content || '')}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  /** 获取条目的展示标题（用于条目卡片头部） */
  function getItemTitle(sectionId, item) {
    const f = item.fields;
    if (sectionId && sectionId.startsWith('custom-')) {
      return escapeHTML(f.title || f.name || '未填写项目/经历');
    }
    switch (sectionId) {
      case 'education': return escapeHTML(f.school || '未填写学校');
      case 'experience': return escapeHTML(f.company || '未填写公司');
      case 'projects': return escapeHTML(f.name || '未填写项目');
      case 'skills': return escapeHTML(f.name || '未填写技能');
      case 'awards': return escapeHTML(f.name || '未填写奖项');
      case 'certificates': return escapeHTML(f.name || '未填写证书');
      default: return '条目';
    }
  }

  // ============================================================
  // 主渲染函数
  // ============================================================
  function render(data) {
    _data = data || _data;
    if (!_container || !_data) return;

    const sortedSections = [..._data.sections].sort((a, b) => a.order - b.order);

    let html = renderBasicInfo(_data.basicInfo);

    sortedSections.forEach((section) => {
      if (section.id === 'summary' || section.type === 'text') {
        html += renderSummarySection(section);
      } else {
        html += renderListSection(section);
      }
    });

    _container.innerHTML = html;

    // 初始化各板块内条目的拖拽排序
    initItemDragDrop();

    // 自动调整所有渲染出来的 textarea 的高度
    _container.querySelectorAll('textarea').forEach((ta) => {
      adjustTextareaHeight(ta);
    });
  }

  // ============================================================
  // 条目级别拖拽排序
  // ============================================================
  function initItemDragDrop() {
    const itemContainers = _container.querySelectorAll('.items-container');
    itemContainers.forEach((ic) => {
      const sectionId = ic.dataset.section;
      DragDrop.init(ic, '.drag-handle', (fromIndex, toIndex) => {
        const section = findSection(sectionId);
        if (!section || !section.items) return;
        const [moved] = section.items.splice(fromIndex, 1);
        section.items.splice(toIndex, 0, moved);
        notifyChange();
      });
    });
  }

  // ============================================================
  // 事件处理（使用事件委托）
  // ============================================================
  function setupEventListeners() {
    if (!_container) return;

    // ---- 输入事件（防抖） ----
    _container.addEventListener('input', (e) => {
      const target = e.target;

      // 如果是 textarea，自动调节其高度（同步进行，避免防抖延迟导致闪烁）
      if (target.tagName === 'TEXTAREA') {
        adjustTextareaHeight(target);
      }

      // 基本信息字段
      if (target.dataset.basic) {
        debounce(() => {
          _data.basicInfo[target.dataset.basic] = target.value;
          notifyChange();
        });
        return;
      }

      // 板块显示标题重命名
      if (target.dataset.sectionTitle) {
        debounce(() => {
          const sectionId = target.dataset.sectionTitle;
          const section = findSection(sectionId);
          if (section) {
            section.customTitle = target.value.trim() || '';
            // 同步修改左侧折叠面板头部的标题文本
            const sectionEl = target.closest('.editor-section');
            if (sectionEl) {
              const titleEl = sectionEl.querySelector('.section-title');
              if (titleEl) {
                titleEl.textContent = section.customTitle || section.title;
              }
            }
            notifyChange();
          }
        });
        return;
      }

      // 板块字段
      if (target.dataset.section && target.dataset.field) {
        debounce(() => {
          const sectionId = target.dataset.section;
          const itemId = target.dataset.item;
          const fieldKey = target.dataset.field;

          const section = findSection(sectionId);
          if (section && (sectionId === 'summary' || section.type === 'text') && fieldKey === 'content') {
            section.content = target.value;
            notifyChange();
          } else if (itemId) {
            // 普通条目字段
            const item = findItem(sectionId, itemId);
            if (item) {
              item.fields[fieldKey] = target.value;
              // 更新卡片标题
              const card = target.closest('.item-card');
              if (card) {
                const titleEl = card.querySelector('.item-card-title');
                if (titleEl) {
                  titleEl.textContent = getItemTitleText(sectionId, item);
                }
              }
              notifyChange();
            }
          }
        });
        return;
      }
    });

    // ---- change 事件（select 和 checkbox） ----
    _container.addEventListener('change', (e) => {
      const target = e.target;

      // select 字段
      if (target.tagName === 'SELECT' && target.dataset.section && target.dataset.item && target.dataset.field) {
        const item = findItem(target.dataset.section, target.dataset.item);
        if (item) {
          item.fields[target.dataset.field] = target.value;
          notifyChange();
        }
        return;
      }

      // 可见性切换
      if (target.dataset.action === 'toggle-visibility') {
        const section = findSection(target.dataset.section);
        if (section) {
          section.visible = target.checked;
          notifyChange();
        }
        return;
      }

      // 照片上传
      if (target.id === 'photo-upload-input') {
        const file = target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          window.customAlert('请选择图片文件');
          return;
        }
        // 我们允许最大 10MB 的原始图片上传，并在客户端进行自动压缩以满足用户需求并保护 LocalStorage 不超额
        if (file.size > 10 * 1024 * 1024) {
          window.customAlert('照片大小不能超过 10MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            // 创建 canvas 进行尺寸和画质双重压缩
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置压缩后的最大尺寸（对于简历照片 80px * 105px，600x800 的分辨率已是非常高清晰度了）
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // 导出为 JPEG，质量设为 0.82，这能在保证极佳清晰度的同时，使图片体积缩减至 30KB - 80KB
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            
            _data.basicInfo.photo = compressedBase64;
            render(_data);
            notifyChange();
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        return;
      }
    });

    // ---- 点击事件 ----
    _container.addEventListener('click', (e) => {
      const target = e.target;

      // 阻止切换开关冒泡到折叠事件
      if (target.closest('.visibility-toggle')) {
        e.stopPropagation();
        return;
      }

      // 删除板块 (阻止冒泡到折叠事件)
      if (target.closest('[data-action="delete-section"]')) {
        e.stopPropagation();
        const deleteSectionBtn = target.closest('[data-action="delete-section"]');
        const sectionId = deleteSectionBtn.dataset.section;
        window.customConfirm('确定要删除整个自定义板块及其中所有内容吗？').then((yes) => {
          if (yes) {
            _data.sections = _data.sections.filter((s) => s.id !== sectionId);
            render(_data);
            notifyChange();
          }
        });
        return;
      }

      // 折叠/展开板块
      const toggleBtn = target.closest('[data-action="toggle-section"]');
      if (toggleBtn) {
        const sectionEl = toggleBtn.closest('.editor-section');
        if (sectionEl) {
          const content = sectionEl.querySelector('.section-content');
          const arrow = toggleBtn.querySelector('.collapse-arrow');
          if (content) {
            content.classList.toggle('collapsed');
            
            // 如果是展开，自动调整其下的所有 textarea 高度
            if (!content.classList.contains('collapsed')) {
              setTimeout(() => {
                content.querySelectorAll('textarea').forEach((ta) => {
                  adjustTextareaHeight(ta);
                });
              }, 120); // 留出一点 CSS 过渡时间以防 scrollHeight 测量不准
            }
          }
          if (arrow) {
            arrow.classList.toggle('rotated');
          }
        }
        return;
      }

      // 添加条目
      const addBtn = target.closest('[data-action="add-item"]');
      if (addBtn) {
        const sectionId = addBtn.dataset.section;
        const section = findSection(sectionId);
        if (!section) return;

        const fields = getSectionFields(sectionId);
        if (!fields) return;

        // 创建空条目
        const newItem = {
          id: ResumeStorage.generateId(),
          fields: {}
        };
        fields.forEach((f) => {
          newItem.fields[f.key] = '';
        });

        if (!section.items) section.items = [];
        section.items.push(newItem);

        render(_data);
        notifyChange();

        // 滚动到新条目
        requestAnimationFrame(() => {
          const newCard = _container.querySelector(`.item-card[data-item="${newItem.id}"]`);
          if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newCard.classList.add('item-card--highlight');
            setTimeout(() => newCard.classList.remove('item-card--highlight'), 1500);
          }
        });
        return;
      }

      // 删除条目
      const deleteBtn = target.closest('[data-action="delete-item"]');
      if (deleteBtn) {
        const sectionId = deleteBtn.dataset.section;
        const itemId = deleteBtn.dataset.item;
        window.customConfirm('确定要删除此项吗？').then((yes) => {
          if (yes) {
            const section = findSection(sectionId);
            if (section && section.items) {
              section.items = section.items.filter((it) => it.id !== itemId);
              render(_data);
              notifyChange();
            }
          }
        });
        return;
      }

      // 移除照片
      const removePhotoBtn = target.closest('[data-action="remove-photo"]');
      if (removePhotoBtn) {
        _data.basicInfo.photo = '';
        render(_data);
        notifyChange();
        return;
      }
    });
  }

  /** 获取条目标题文本（不转义，用于 textContent） */
  function getItemTitleText(sectionId, item) {
    const f = item.fields;
    if (sectionId && sectionId.startsWith('custom-')) {
      return f.title || f.name || '未填写项目/经历';
    }
    switch (sectionId) {
      case 'education': return f.school || '未填写学校';
      case 'experience': return f.company || '未填写公司';
      case 'projects': return f.name || '未填写项目';
      case 'skills': return f.name || '未填写技能';
      case 'awards': return f.name || '未填写奖项';
      case 'certificates': return f.name || '未填写证书';
      default: return '条目';
    }
  }

  // ============================================================
  // 公共 API
  // ============================================================
  return {
    /**
     * 初始化编辑器
     * @param {HTMLElement} container - 编辑器容器 (#editor-sections)
     * @param {Object} data - 当前简历数据
     * @param {Function} onChange - 数据变更回调
     */
    init(container, data, onChange) {
      _container = container;
      _data = data;
      _onChange = onChange;

      setupEventListeners();
      render(data);
    },

    /**
     * 重新渲染整个编辑器
     */
    render(data) {
      render(data);
    },

    /**
     * 获取当前编辑器中的数据
     */
    getData() {
      return deepClone(_data);
    }
  };
})();

// 挂载到全局
window.ResumeEditor = ResumeEditor;
