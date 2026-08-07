/**
 * app.js - Main app coordinator.
 */

(function () {
  'use strict';

  let currentData = null;
  let saveTimer = null;
  const AUTO_SAVE_DELAY = 300;

  // Undo/Redo historical stacks
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 50;
  let lastPushTime = 0;
  const DEBOUNCE_PUSH_MS = 800;
  let isUndoRedoAction = false;

  function pushHistory(data) {
    const serialized = JSON.stringify(data);
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === serialized) {
      return;
    }
    const now = Date.now();
    if (now - lastPushTime < DEBOUNCE_PUSH_MS && undoStack.length > 0) {
      lastPushTime = now;
      redoStack.length = 0;
      return;
    }
    undoStack.push(serialized);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack.length = 0;
    lastPushTime = now;
  }

  function undo() {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();
    redoStack.push(JSON.stringify(currentData));
    isUndoRedoAction = true;
    const parsed = JSON.parse(previousState);
    ResumeEditor.render(parsed);
    handleDataChange(parsed);
    isUndoRedoAction = false;
  }

  function redo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    undoStack.push(JSON.stringify(currentData));
    isUndoRedoAction = true;
    const parsed = JSON.parse(nextState);
    ResumeEditor.render(parsed);
    handleDataChange(parsed);
    isUndoRedoAction = false;
  }

  function updateMeta(updaterFn) {
    const nextData = deepClone(currentData);
    updaterFn(nextData.meta);
    handleDataChange(nextData);
  }

  // Custom alert and confirm handlers using our in-page modals
  window.customConfirm = function (message, title = '提示') {
    return new Promise((resolve) => {
      const modal = document.getElementById('custom-confirm-modal');
      const titleEl = document.getElementById('confirm-title');
      const msgEl = document.getElementById('confirm-message');
      const cancelBtn = document.getElementById('confirm-cancel-btn');
      const okBtn = document.getElementById('confirm-ok-btn');

      if (!modal || !msgEl || !cancelBtn || !okBtn) {
        resolve(confirm(message));
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      cancelBtn.style.display = 'inline-block';
      modal.style.display = 'flex';

      const cleanup = (result) => {
        modal.style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onOverlayClick);
        resolve(result);
      };

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onOverlayClick(e) { if (e.target === modal) cleanup(false); }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onOverlayClick);
    });
  };

  window.customAlert = function (message, title = '提示') {
    return new Promise((resolve) => {
      const modal = document.getElementById('custom-confirm-modal');
      const titleEl = document.getElementById('confirm-title');
      const msgEl = document.getElementById('confirm-message');
      const cancelBtn = document.getElementById('confirm-cancel-btn');
      const okBtn = document.getElementById('confirm-ok-btn');

      if (!modal || !msgEl || !okBtn) {
        alert(message);
        resolve();
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      if (cancelBtn) cancelBtn.style.display = 'none';
      modal.style.display = 'flex';

      const cleanup = () => {
        modal.style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        modal.removeEventListener('click', onOverlayClick);
        resolve();
      };

      function onOk() { cleanup(); }
      function onOverlayClick(e) { if (e.target === modal) cleanup(); }

      okBtn.addEventListener('click', onOk);
      modal.addEventListener('click', onOverlayClick);
    });
  };

  function showSavedIndicator() {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.opacity = '0';
    }, 1200);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const legacyData = ResumeStorage.load();
    if (window.ResumeVersions) {
      ResumeVersions.initialize(legacyData);
      currentData = ResumeVersions.load();
    } else {
      currentData = legacyData;
    }

    initDarkMode();

    const editorContainer = document.getElementById('editor-sections');
    ResumeEditor.init(editorContainer, currentData, handleDataChange);

    const previewContainer = document.getElementById('resume-preview');
    ResumePreview.init(previewContainer);
    ResumePreview.render(currentData);

    bindToolbarEvents();
    initSectionDragDrop();
    syncToolbarState();

    window.addEventListener('resize', debounce(() => {
      ResumePreview.refreshLayout();
    }, 150));
    window.addEventListener('beforeprint', prepareForPrint);

    // Keyboard shortcuts for Undo/Redo and Escape key
    document.addEventListener('keydown', (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (isCtrlOrMeta) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach((modal) => {
          modal.style.display = 'none';
        });
      }
    });

    console.log('Resume editor initialized.');
  });

  function handleDataChange(updatedData) {
    if (!isUndoRedoAction) {
      pushHistory(currentData);
    }
    currentData = updatedData;
    ResumePreview.updateTheme(currentData.meta);
    ResumePreview.render(currentData);
    syncToolbarState();
    autoSave();
  }

  function persistCurrentData() {
    if (window.ResumeVersions) {
      return ResumeVersions.saveActive(currentData);
    }
    return ResumeStorage.save(currentData);
  }

  function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const ok = persistCurrentData();
      if (ok === false) {
        showToast('保存失败：本地存储空间不足，请尝试压缩或移除证件照后重试。', 'error');
      } else {
        showSavedIndicator();
      }
    }, AUTO_SAVE_DELAY);
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function resetFitSpacing(meta) {
    meta.spacingScale = 1;
    meta.fitSectionGap = 0;
    meta.fitItemGap = 0;
  }

  function bindResumeVersionSelector() {
    const select = document.getElementById('resume-version-select');
    if (!select || !window.ResumeVersions) return;

    const versions = ResumeVersions.list();
    select.innerHTML = '';
    versions.forEach((version) => {
      const option = document.createElement('option');
      option.value = version.id;
      option.textContent = version.name;
      option.title = version.note || version.jobTarget || '';
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      switchResumeVersion(select.value);
    });
    updateResumeVersionHint();
  }

  function updateResumeVersionHint() {
    const hint = document.getElementById('resume-version-hint');
    if (!hint || !window.ResumeVersions) return;

    const metadata = ResumeVersions.getMetadata();
    if (!metadata) return;
    hint.textContent = 'BOSS 定向';
    hint.title = [metadata.note, metadata.gap].filter(Boolean).join('\n');
  }

  function switchResumeVersion(versionId) {
    if (!window.ResumeVersions || !versionId || versionId === ResumeVersions.getActiveId()) return;

    clearTimeout(saveTimer);
    persistCurrentData();
    if (!ResumeVersions.setActiveId(versionId)) return;

    currentData = ResumeVersions.load(versionId);
    undoStack.length = 0;
    redoStack.length = 0;
    lastPushTime = 0;
    initDarkMode();
    ResumeEditor.render(currentData);
    ResumePreview.render(currentData);
    syncToolbarState();
    initSectionDragDrop();

    const metadata = ResumeVersions.getMetadata(versionId);
    showToast(`已切换到“${metadata?.name || currentData.basicInfo.jobTarget}”简历`, 'success');
  }

  function bindToolbarEvents() {
    bindResumeVersionSelector();

    const templateSelect = document.getElementById('template-select');
    if (templateSelect) {
      templateSelect.addEventListener('change', (event) => {
        updateMeta((meta) => {
          meta.template = event.target.value;
          resetFitSpacing(meta);
          ResumePreview.setTemplate(event.target.value);
        });
      });
    }

    document.querySelectorAll('.color-preset').forEach((button) => {
      button.addEventListener('click', () => {
        const color = button.dataset.color;
        if (!color) return;

        updateMeta((meta) => {
          meta.themeColor = color;
        });

        document.querySelectorAll('.color-preset').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');

        const colorInput = document.getElementById('theme-color-input');
        if (colorInput) colorInput.value = color;
      });
    });

    const themeColorInput = document.getElementById('theme-color-input');
    if (themeColorInput) {
      themeColorInput.addEventListener('input', (event) => {
        updateMeta((meta) => {
          meta.themeColor = event.target.value;
        });
        document.querySelectorAll('.color-preset').forEach((button) => {
          button.classList.toggle('active', button.dataset.color === event.target.value);
        });
      });
    }

    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeInput = document.getElementById('font-size-input');
    const applyFontSize = (rawValue) => {
      const min = Number(fontSizeRange?.min || 12);
      const max = Number(fontSizeRange?.max || 16);
      const step = Number(fontSizeRange?.step || 0.5);
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed)) return;
      const value = Math.min(max, Math.max(min, Math.round(parsed / step) * step));

      updateMeta((meta) => {
        meta.fontSize = value;
        resetFitSpacing(meta);
      });
      if (fontSizeRange) fontSizeRange.value = String(value);
      if (fontSizeInput) fontSizeInput.value = String(value);
    };
    if (fontSizeRange) {
      fontSizeRange.addEventListener('input', (event) => applyFontSize(event.target.value));
    }
    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', (event) => applyFontSize(event.target.value));
      fontSizeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      });
    }

    const lineHeightRange = document.getElementById('line-height-range');
    const lineHeightValue = document.getElementById('line-height-value');
    if (lineHeightRange) {
      lineHeightRange.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        updateMeta((meta) => {
          meta.lineHeight = value;
          resetFitSpacing(meta);
        });
        if (lineHeightValue) lineHeightValue.textContent = value.toFixed(1);
      });
    }

    const marginSelect = document.getElementById('margin-select');
    if (marginSelect) {
      marginSelect.addEventListener('change', (event) => {
        updateMeta((meta) => {
          meta.margin = event.target.value;
          resetFitSpacing(meta);
        });
      });
    }

    const fontFamilySelect = document.getElementById('font-family-select');
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', (event) => {
        updateMeta((meta) => {
          meta.fontFamily = event.target.value;
          resetFitSpacing(meta);
        });
      });
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        updateMeta((meta) => {
          const html = document.documentElement;
          const isCurrentlyDark = html.getAttribute('data-theme') !== 'light';

          if (isCurrentlyDark) {
            html.setAttribute('data-theme', 'light');
            meta.darkMode = false;
          } else {
            html.removeAttribute('data-theme');
            meta.darkMode = true;
          }
          updateDarkModeIcon();
        });
      });
    }

    bindPrintGuide();
    bindDataActions();
    bindFitPage();
    bindCustomSectionModal();
  }

  function bindPrintGuide() {
    const exportPDFBtn = document.getElementById('export-pdf-btn');
    const printGuideModal = document.getElementById('print-guide-modal');
    const guideCancelBtn = document.getElementById('guide-cancel-btn');
    const guidePrintBtn = document.getElementById('guide-print-btn');
    const guideDownloadBtn = document.getElementById('guide-download-btn');

    if (exportPDFBtn && printGuideModal) {
      exportPDFBtn.addEventListener('click', () => {
        printGuideModal.style.display = 'flex';
      });
    }

    if (guideCancelBtn && printGuideModal) {
      guideCancelBtn.addEventListener('click', () => {
        printGuideModal.style.display = 'none';
      });
    }

    if (guidePrintBtn && printGuideModal) {
      guidePrintBtn.addEventListener('click', async () => {
        printGuideModal.style.display = 'none';
        prepareForPrint();
        if (ResumePreview.isOverflowing()) {
          const go = await window.customConfirm('内容超出一页，直接打印会被裁剪。是否先“适应整页”后再打印？\n（取消 ＝ 直接打印）');
          if (go) {
            fitToWholePage();
          }
        }
        setTimeout(() => {
          window.print();
        }, 150);
      });
    }

    if (guideDownloadBtn && printGuideModal) {
      guideDownloadBtn.addEventListener('click', () => {
        printGuideModal.style.display = 'none';
        exportPdfDirect();
      });
    }

    if (printGuideModal) {
      printGuideModal.addEventListener('click', (event) => {
        if (event.target === printGuideModal) {
          printGuideModal.style.display = 'none';
        }
      });
    }
  }

  function safeFilenamePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || '未命名';
  }

  async function exportPdfDirect() {
    prepareForPrint();
    const el = document.getElementById('resume-preview');
    if (!el) return;

    // 溢出守卫：超过一页先问用户
    if (ResumePreview.isOverflowing()) {
      const go = await window.customConfirm(
        '当前内容超出一页，导出后超出部分会被裁剪。\n建议先点“适应整页”。是否仍要继续导出？'
      );
      if (!go) return;
    }

    ResumePreview.clearVisualPageBreaks();
    await (document.fonts && document.fonts.ready); // 等字体，避免换行差异

    const A4H = ResumePreview.A4_HEIGHT_PX; // 1122.5, 统一常量
    const saved = {
      h: el.style.height,
      mh: el.style.maxHeight,
      ov: el.style.overflow,
      bs: el.style.boxShadow,
      bd: el.style.border,
      tf: el.style.transform,
      to: el.style.transformOrigin
    };

    el.style.height = `${A4H}px`; // 固定一页
    el.style.maxHeight = `${A4H}px`;
    el.style.overflow = 'hidden'; // 与系统打印一致：超出裁剪
    el.style.boxShadow = 'none';
    el.style.border = 'none';
    el.style.transform = 'none'; // 重置预览缩放，避免 PDF 内容被缩小/偏移
    el.style.transformOrigin = '';

    const opt = {
      margin: 0,
      filename: `简历_${safeFilenamePart(currentData.basicInfo.name || '未命名')}_${safeFilenamePart(currentData.basicInfo.jobTarget || '求职')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        height: A4H,
        windowHeight: A4H
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: [] } // 不分页，单页输出
    };

    showToast('正在生成 PDF，请稍候...', 'success');
    const restore = () => {
      el.style.height = saved.h;
      el.style.maxHeight = saved.mh;
      el.style.overflow = saved.ov;
      el.style.boxShadow = saved.bs;
      el.style.border = saved.bd;
      el.style.transform = saved.tf;
      el.style.transformOrigin = saved.to;
      ResumePreview.refreshLayout();
    };

    html2pdf().set(opt).from(el).save()
      .then(() => {
        showToast('PDF 下载成功！', 'success');
        restore();
      })
      .catch((err) => {
        console.error(err);
        showToast('生成 PDF 失败，请改用“系统打印”。', 'error');
        restore();
      });
  }

  function bindDataActions() {
    const exportJSONBtn = document.getElementById('export-json-btn');
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', () => {
        const versionName = window.ResumeVersions?.getMetadata()?.name || currentData.basicInfo.jobTarget || '简历';
        ResumeStorage.exportJSON(currentData, versionName);
      });
    }

    const importJSONBtn = document.getElementById('import-json-btn');
    const importJSONInput = document.getElementById('import-json-input');
    if (importJSONBtn && importJSONInput) {
      importJSONBtn.addEventListener('click', () => {
        importJSONInput.click();
      });

      importJSONInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          currentData = await ResumeStorage.importJSON(file);
          persistCurrentData();
          ResumeEditor.render(currentData);
          ResumePreview.render(currentData);
          syncToolbarState();
          initSectionDragDrop();
          window.customAlert('导入成功！');
        } catch (error) {
          window.customAlert(`导入失败：${error.message}`);
        }

        importJSONInput.value = '';
      });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const versionName = window.ResumeVersions?.getMetadata()?.name || '当前版本';
        const yes = await window.customConfirm(`确定要将“${versionName}”恢复为内置版本吗？当前版本的修改将被覆盖。`);
        if (!yes) return;

        currentData = window.ResumeVersions ? ResumeVersions.resetActive() : ResumeStorage.reset();
        ResumeEditor.render(currentData);
        ResumePreview.render(currentData);
        syncToolbarState();
        initSectionDragDrop();
      });
    }
  }

  function bindFitPage() {
    const fitPageBtn = document.getElementById('fit-page-btn');
    if (fitPageBtn) {
      fitPageBtn.addEventListener('click', () => {
        fitToWholePage();
      });
    }
  }

  function bindCustomSectionModal() {
    const addCustomSectionBtn = document.getElementById('btn-add-custom-section');
    const addSectionModal = document.getElementById('add-section-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const newSectionTitleInput = document.getElementById('new-section-title');
    const newSectionTypeSelect = document.getElementById('new-section-type');

    if (addCustomSectionBtn && addSectionModal) {
      addCustomSectionBtn.addEventListener('click', () => {
        addSectionModal.style.display = 'flex';
        if (newSectionTitleInput) {
          newSectionTitleInput.value = '';
          newSectionTitleInput.focus();
        }
      });
    }

    if (modalCancelBtn && addSectionModal) {
      modalCancelBtn.addEventListener('click', () => {
        addSectionModal.style.display = 'none';
      });
    }

    if (addSectionModal) {
      addSectionModal.addEventListener('click', (event) => {
        if (event.target === addSectionModal) {
          addSectionModal.style.display = 'none';
        }
      });
    }

    if (modalConfirmBtn && addSectionModal && newSectionTitleInput && newSectionTypeSelect) {
      modalConfirmBtn.addEventListener('click', async () => {
        const title = newSectionTitleInput.value.trim();
        if (!title) {
          await window.customAlert('请输入板块名称');
          return;
        }

        const type = newSectionTypeSelect.value;
        const newSection = {
          id: `custom-${Date.now()}`,
          title,
          icon: chooseCustomSectionIcon(title, type),
          type,
          visible: true,
          order: currentData.sections.length
        };

        if (type === 'list') {
          newSection.items = [];
        } else {
          newSection.content = '';
        }

        currentData.sections.push(newSection);
        persistCurrentData();
        ResumeEditor.render(currentData);
        ResumePreview.render(currentData);
        addSectionModal.style.display = 'none';
        newSectionTitleInput.value = '';
        initSectionDragDrop();
      });
    }
  }

  function chooseCustomSectionIcon(title, type) {
    if (type !== 'list') return 'summary';
    if (
      title.includes('实习') ||
      title.includes('工作') ||
      title.includes('经历') ||
      title.includes('实践') ||
      title.includes('岗位')
    ) {
      return 'work';
    }
    return 'project';
  }

  function initDarkMode() {
    const html = document.documentElement;

    if (currentData.meta.darkMode === false) {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }

    updateDarkModeIcon();
  }

  function updateDarkModeIcon() {
    const btn = document.getElementById('dark-mode-toggle');
    if (!btn) return;

    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    const sunIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    const moonIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    btn.innerHTML = isLight ? sunIcon : moonIcon;
    btn.title = isLight ? '切换到暗色模式' : '切换到亮色模式';
  }

  function syncToolbarState() {
    const meta = currentData.meta;

    const versionSelect = document.getElementById('resume-version-select');
    if (versionSelect && window.ResumeVersions) {
      versionSelect.value = ResumeVersions.getActiveId();
    }
    updateResumeVersionHint();

    const templateSelect = document.getElementById('template-select');
    if (templateSelect) templateSelect.value = meta.template;

    const themeColorInput = document.getElementById('theme-color-input');
    if (themeColorInput) themeColorInput.value = meta.themeColor;

    document.querySelectorAll('.color-preset').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color === meta.themeColor);
    });

    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeInput = document.getElementById('font-size-input');
    if (fontSizeRange) fontSizeRange.value = meta.fontSize;
    if (fontSizeInput) fontSizeInput.value = meta.fontSize;

    const lineHeightRange = document.getElementById('line-height-range');
    const lineHeightValue = document.getElementById('line-height-value');
    if (lineHeightRange) lineHeightRange.value = meta.lineHeight;
    if (lineHeightValue) lineHeightValue.textContent = Number(meta.lineHeight).toFixed(1);

    const marginSelect = document.getElementById('margin-select');
    if (marginSelect) marginSelect.value = meta.margin;

    const fontFamilySelect = document.getElementById('font-family-select');
    if (fontFamilySelect) fontFamilySelect.value = meta.fontFamily || 'sans-serif';

    updateDarkModeIcon();
  }

  function getRangeBounds(id, fallbackMin, fallbackMax) {
    const input = document.getElementById(id);
    return {
      min: input ? parseFloat(input.min) : fallbackMin,
      max: input ? parseFloat(input.max) : fallbackMax
    };
  }

  function buildFitSteps(min, max, step, extraValues = []) {
    const values = [];
    for (let value = max; value >= min - 0.001; value -= step) {
      values.push(Number(value.toFixed(3)));
    }
    extraValues.forEach((value) => {
      if (value >= min && value <= max) values.push(Number(value.toFixed(3)));
    });
    return [...new Set(values)].sort((a, b) => b - a);
  }

  function orderFitMargins(currentMargin) {
    return [currentMargin, 'loose', 'standard', 'compact']
      .filter((margin, index, all) => margin && all.indexOf(margin) === index);
  }

  function applyFitConfig(previewEl, meta, config) {
    Object.assign(meta, {
      fontSize: config.fontSize,
      lineHeight: config.lineHeight,
      margin: config.margin,
      fontFamily: config.fontFamily || 'sans-serif',
      spacingScale: config.spacingScale,
      fitSectionGap: config.fitSectionGap || 0,
      fitItemGap: config.fitItemGap || 0
    });
    ResumePreview.updateTheme(meta);
    previewEl.getBoundingClientRect();
  }

  function countVisibleFitElements(root, selector) {
    return Array.from(root.querySelectorAll(selector))
      .filter((el) => el.offsetParent !== null).length;
  }

  function getPrintSafeHeight() {
    return ResumePreview.PRINT_SAFE_HEIGHT_PX || ((ResumePreview.A4_HEIGHT_PX || 1122.5) - 40);
  }

  function getA4Height() {
    return ResumePreview.A4_HEIGHT_PX || 1122.5;
  }

  function measureFitConfig(previewEl, meta, config) {
    applyFitConfig(previewEl, meta, config);
    return ResumePreview.measureContentHeight();
  }

  function trimFitGapsToHeight(previewEl, meta, maxHeight) {
    const currentConfig = {
      fontSize: Number(meta.fontSize) || 14,
      lineHeight: Number(meta.lineHeight) || 1.5,
      margin: meta.margin || 'standard',
      fontFamily: meta.fontFamily || 'sans-serif',
      spacingScale: Number(meta.spacingScale) || 1,
      fitSectionGap: Number(meta.fitSectionGap) || 0,
      fitItemGap: Number(meta.fitItemGap) || 0
    };
    const currentHeight = measureFitConfig(previewEl, meta, currentConfig);
    if (currentHeight <= maxHeight) return false;
    if (currentConfig.fitSectionGap <= 0 && currentConfig.fitItemGap <= 0) return false;

    let low = 0;
    let high = 1;
    let best = { ...currentConfig, fitSectionGap: 0, fitItemGap: 0 };

    for (let i = 0; i < 16; i += 1) {
      const ratio = (low + high) / 2;
      const candidate = {
        ...currentConfig,
        fitSectionGap: Number((currentConfig.fitSectionGap * ratio).toFixed(2)),
        fitItemGap: Number((currentConfig.fitItemGap * ratio).toFixed(2))
      };
      const height = measureFitConfig(previewEl, meta, candidate);
      if (height <= maxHeight) {
        best = { ...candidate };
        low = ratio;
      } else {
        high = ratio;
      }
    }

    applyFitConfig(previewEl, meta, best);
    return true;
  }

  function prepareForPrint() {
    if (!currentData) return;

    const previewEl = document.getElementById('resume-preview');
    if (!previewEl) return;

    const changed = trimFitGapsToHeight(previewEl, currentData.meta, getPrintSafeHeight());
    if (!changed) return;

    syncToolbarState();
    ResumePreview.render(currentData);
    persistCurrentData();
  }

  function fitToWholePage() {
    const previewEl = document.getElementById('resume-preview');
    if (!previewEl) return;

    showToast('正在智能排版，请稍候...', 'success');

    const meta = currentData.meta;
    const targetHeight = getPrintSafeHeight();
    const pageHeight = getA4Height();
    const current = {
      fontSize: Number(meta.fontSize) || 14,
      lineHeight: Number(meta.lineHeight) || 1.5,
      margin: meta.margin || 'standard',
      fontFamily: meta.fontFamily || 'sans-serif',
      spacingScale: Number(meta.spacingScale) || 1
    };

    const fontRange = getRangeBounds('font-size-range', 12, 16);
    const lineRange = getRangeBounds('line-height-range', 1.2, 1.8);

    // Local measurement cache for this run
    const measureCache = new Map();
    const measure = (config) => {
      const key = `${config.fontSize}|${config.lineHeight}|${config.margin}|${config.spacingScale}|${config.fitSectionGap || 0}|${config.fitItemGap || 0}|${config.fontFamily || 'sans-serif'}`;
      if (measureCache.has(key)) {
        return measureCache.get(key);
      }
      const h = measureFitConfig(previewEl, meta, config);
      measureCache.set(key, h);
      return h;
    };

    // 1. Try to adjust only spacingScale with current settings
    let currentFeasible = null;
    let low = 0.45;
    let high = 2.8;
    for (let i = 0; i < 8; i += 1) {
      const spacingScale = Number(((low + high) / 2).toFixed(3));
      const candidate = {
        fontSize: current.fontSize,
        lineHeight: current.lineHeight,
        margin: current.margin,
        fontFamily: current.fontFamily,
        spacingScale,
        fitSectionGap: 0,
        fitItemGap: 0
      };
      const height = measure(candidate);
      if (height <= targetHeight) {
        currentFeasible = { ...candidate, height };
        low = spacingScale;
      } else {
        high = spacingScale;
      }
    }

    // Early exit if current settings fit well with minor scaling (0.75x to 1.4x)
    if (currentFeasible && currentFeasible.spacingScale >= 0.75 && currentFeasible.spacingScale <= 1.4) {
      applyFitAndGaps(previewEl, meta, currentFeasible, targetHeight, pageHeight, measure);
      return;
    }

    // 2. Progressive search: run narrow search first, and expand to full search if it fails
    const fonts = [...new Set([
      current.fontSize,
      current.fontSize - 0.5,
      current.fontSize - 1.0,
      current.fontSize + 0.5,
      current.fontSize + 1.0
    ])].filter(f => f >= fontRange.min && f <= fontRange.max);

    const lines = [...new Set([
      current.lineHeight,
      current.lineHeight - 0.08,
      current.lineHeight - 0.15,
      current.lineHeight + 0.08,
      current.lineHeight + 0.15
    ].map(l => Number(l.toFixed(2))))].filter(l => l >= lineRange.min && l <= lineRange.max);

    const margins = orderFitMargins(current.margin);

    let best = currentFeasible;
    if (best) {
      const bestGap = targetHeight - best.height;
      best.score = Math.abs(best.spacingScale - current.spacingScale) * 4 + bestGap * 0.02;
    }

    const runSearch = (fontList, lineList) => {
      for (const margin of margins) {
        for (const fontSize of fontList) {
          for (const lineHeight of lineList) {
            // Skip redundant measurement if it's the current settings (already evaluated)
            if (margin === current.margin && fontSize === current.fontSize && lineHeight === current.lineHeight) {
              continue;
            }

            let scaleLow = 0.45;
            let scaleHigh = 2.8;
            let feasible = null;

            for (let i = 0; i < 8; i += 1) {
              const spacingScale = Number(((scaleLow + scaleHigh) / 2).toFixed(3));
              const candidate = { fontSize, lineHeight, margin, fontFamily: current.fontFamily, spacingScale, fitSectionGap: 0, fitItemGap: 0 };
              const height = measure(candidate);
              if (height <= targetHeight) {
                feasible = { ...candidate, height };
                scaleLow = spacingScale;
              } else {
                scaleHigh = spacingScale;
              }
            }

            if (feasible) {
              const gap = targetHeight - feasible.height;
              const distance = Math.abs(fontSize - current.fontSize) * 3
                + Math.abs(lineHeight - current.lineHeight) * 25
                + Math.abs(feasible.spacingScale - current.spacingScale) * 4
                + (margin === current.margin ? 0 : 2);
              const score = distance + gap * 0.02;
              if (!best || score < best.score) {
                best = { ...feasible, score };
              }
            }
          }
        }
      }
    };

    // Run narrow search first
    runSearch(fonts, lines);

    // If narrow search fails to find any feasible configuration, run full search over the entire range
    if (!best) {
      const fullFonts = [];
      for (let f = fontRange.min; f <= fontRange.max; f += 0.5) {
        fullFonts.push(f);
      }
      const fullLines = [];
      for (let l = lineRange.min; l <= lineRange.max; l += 0.1) {
        fullLines.push(Number(l.toFixed(2)));
      }
      runSearch(fullFonts, fullLines);
    }

    if (!best) {
      best = {
        fontSize: fontRange.min,
        lineHeight: lineRange.min,
        margin: 'compact',
        fontFamily: current.fontFamily,
        spacingScale: 0.45,
        fitSectionGap: 0,
        fitItemGap: 0
      };
      applyFitConfig(previewEl, meta, best);
      syncToolbarState();
      ResumePreview.render(currentData);
      autoSave();
      alert('内容仍然超过一页，已应用最紧凑排版。建议删减或精简部分描述文字。');
      return;
    }

    applyFitAndGaps(previewEl, meta, best, targetHeight, pageHeight, measure);
  }

  function applyFitAndGaps(previewEl, meta, best, targetHeight, pageHeight, measure) {
    const sectionCount = Math.max(1, countVisibleFitElements(previewEl, '.resume-body > .resume-section, .resume-main .resume-section'));
    const itemCount = Math.max(1, countVisibleFitElements(previewEl, '.resume-item, .resume-project-item, .resume-education-item, .resume-skill-bullet, .resume-bullets-list li'));
    const fillHeight = Math.min(pageHeight - 8, Math.max(targetHeight, best.height));
    let low = 0;
    let high = Math.max(4, ((fillHeight - best.height) / (sectionCount + itemCount * 0.35)) * 2.4);

    for (let i = 0; i < 12; i += 1) {
      const unit = (low + high) / 2;
      const candidate = {
        ...best,
        fitSectionGap: Number(unit.toFixed(2)),
        fitItemGap: Number((unit * 0.35).toFixed(2))
      };
      const height = measure(candidate);
      if (height <= fillHeight) {
        best = { ...candidate, height };
        low = unit;
      } else {
        high = unit;
      }
    }

    if (best.height > targetHeight) {
      const guardedBest = { ...best, fitSectionGap: 0, fitItemGap: 0 };
      const guardedHeight = measure(guardedBest);
      if (guardedHeight <= targetHeight) {
        best = { ...guardedBest, height: guardedHeight };
      }
    }

    applyFitConfig(previewEl, meta, best);
    syncToolbarState();
    ResumePreview.render(currentData);
    autoSave();
    showToast('已按照打印安全区适应单页，避免 PDF 临界分页。', 'success');
    console.log('[fit page] optimized config:', best, 'height:', best.height);
  }

  function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach((element) => element.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2850);
  }

  function initSectionDragDrop() {
    const editorContainer = document.getElementById('editor-sections');
    if (!editorContainer) return;

    DragDrop.init(editorContainer, '.section-drag-handle', (fromIndex, toIndex) => {
      const realFrom = Math.max(0, fromIndex - 1);
      const realTo = Math.max(0, toIndex - 1);
      const sortedSections = [...currentData.sections].sort((a, b) => a.order - b.order);

      if (realFrom < 0 || realFrom >= sortedSections.length || realTo < 0 || realTo >= sortedSections.length) {
        return;
      }

      const [moved] = sortedSections.splice(realFrom, 1);
      sortedSections.splice(realTo, 0, moved);
      sortedSections.forEach((section, index) => {
        section.order = index;
      });

      currentData.sections.forEach((section) => {
        const sorted = sortedSections.find((item) => item.id === section.id);
        if (sorted) section.order = sorted.order;
      });

      handleDataChange(currentData);
    });
  }

  window.ResumeApp = {
    getData() {
      return deepClone(currentData);
    },
    setData(data) {
      currentData = data;
      persistCurrentData();
      ResumeEditor.render(currentData);
      ResumePreview.render(currentData);
      syncToolbarState();
    },
    render() {
      ResumePreview.render(currentData);
    }
  };
})();
