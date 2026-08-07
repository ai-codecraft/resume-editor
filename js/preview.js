/**
 * preview.js - Resume preview rendering, A4 measuring, and preview scaling.
 */

const ResumePreview = (() => {
  let _container = null;
  let _resizeObserver = null;
  let _layoutFrame = null;

  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1122.5;
  const PRINT_SAFETY_BUFFER_PX = 40;
  const PRINT_SAFE_HEIGHT_PX = A4_HEIGHT_PX - PRINT_SAFETY_BUFFER_PX;
  const OVERFLOW_TOLERANCE_PX = 6; // 容差值，防浏览器渲染取整或微小差异导致的假溢出

  const MARGIN_MAP = {
    compact: '10mm',
    standard: '20mm',
    loose: '25mm'
  };

  function getPageElement() {
    if (!_container) return null;
    const firstChild = _container.firstElementChild;
    if (firstChild && firstChild.classList.contains('resume-page')) {
      return firstChild;
    }
    return _container.querySelector('.resume-page') || _container;
  }

  function getContainerPaddingHeight() {
    if (!_container) return 0;
    const style = window.getComputedStyle(_container);
    return (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
  }

  function forceLayout(element) {
    if (element) {
      element.getBoundingClientRect();
    }
  }

  function isMeasurableElement(element) {
    if (!element || element.classList.contains('preview-page-break-container')) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function measureRenderedHeight(pageEl) {
    if (!_container) return 0;

    const root = pageEl || _container;
    const containerRect = _container.getBoundingClientRect();
    const containerStyle = window.getComputedStyle(_container);
    const paddingBottom = pageEl && pageEl !== _container
      ? (parseFloat(containerStyle.paddingBottom) || 0)
      : 0;
    const elements = [root, ...Array.from(root.querySelectorAll('*'))];

    let bottom = 0;
    elements.forEach((element) => {
      if (!isMeasurableElement(element)) return;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const style = window.getComputedStyle(element);
      const marginBottom = parseFloat(style.marginBottom) || 0;
      bottom = Math.max(bottom, rect.bottom - containerRect.top + marginBottom);
    });

    return Math.ceil(bottom + paddingBottom);
  }

  function scheduleLayout(instance) {
    if (_layoutFrame) {
      cancelAnimationFrame(_layoutFrame);
    }

    _layoutFrame = requestAnimationFrame(() => {
      _layoutFrame = null;
      instance.refreshLayout();
    });
  }

  return {
    A4_WIDTH_PX,
    A4_HEIGHT_PX,
    PRINT_SAFETY_BUFFER_PX,
    PRINT_SAFE_HEIGHT_PX,

    init(container) {
      _container = container;
      if (!_container) {
        console.error('Preview container is missing.');
        return;
      }

      const parent = _container.parentElement;
      if (parent && typeof ResizeObserver !== 'undefined') {
        _resizeObserver = new ResizeObserver(() => {
          scheduleLayout(this);
        });
        _resizeObserver.observe(parent);
      }

      this.refreshLayout();
    },

    render(data) {
      if (!_container) return;

      this.setTemplate(data.meta.template);
      this.updateTheme(data.meta);
      _container.innerHTML = window.ResumeTemplates.render(data);

      scheduleLayout(this);
    },

    updateTheme(meta) {
      if (!_container) return;

      const FONT_MAP = {
        'sans-serif': 'var(--font-sans-family)',
        'serif': 'var(--font-serif-family)',
        'kaiti': 'var(--font-kaiti-family)',
        'xingkai': 'var(--font-xingkai-family)'
      };

      _container.style.setProperty('--theme-color', meta.themeColor);
      _container.style.setProperty('--resume-font-family', FONT_MAP[meta.fontFamily || 'sans-serif']);
      _container.style.setProperty('--resume-font-size', `${meta.fontSize}px`);
      _container.style.setProperty('--resume-line-height', String(meta.lineHeight));
      _container.style.setProperty('--resume-margin', MARGIN_MAP[meta.margin] || MARGIN_MAP.standard);
      _container.style.setProperty('--spacing-scale', String(meta.spacingScale || 1));
      _container.style.setProperty('--fit-section-gap', `${meta.fitSectionGap || 0}px`);
      _container.style.setProperty('--fit-item-gap', `${meta.fitItemGap || 0}px`);
      _container.setAttribute('data-margin', meta.margin);
    },

    setTemplate(template) {
      if (!_container) return;

      Array.from(_container.classList).forEach((cls) => {
        if (cls.startsWith('template-')) {
          _container.classList.remove(cls);
        }
      });
      _container.classList.add(`template-${template || 'modern'}`);
    },

    refreshLayout() {
      this.autoScale();
      this.applyVisualPageBreaks();
    },

    autoScale() {
      if (!_container) return;

      const parent = _container.parentElement;
      const viewport = document.getElementById('preview-panel');
      if (!parent || !viewport) return;

      const viewportStyle = getComputedStyle(viewport);
      const viewportPadding = parseFloat(viewportStyle.paddingLeft) + parseFloat(viewportStyle.paddingRight);
      const availableWidth = viewport.clientWidth - viewportPadding - 8;
      if (availableWidth <= 0) return;

      let scale = availableWidth / A4_WIDTH_PX;
      scale = Math.max(0.3, Math.min(scale, 1));

      const contentHeight = this.measureContentHeight();
      const pageHeight = Math.max(A4_HEIGHT_PX, contentHeight);

      _container.style.transform = `scale(${scale})`;
      _container.style.transformOrigin = 'top left';
      _container.style.height = `${pageHeight}px`;
      _container.classList.toggle('has-overflow', contentHeight > A4_HEIGHT_PX + OVERFLOW_TOLERANCE_PX);

      parent.style.width = `${A4_WIDTH_PX * scale}px`;
      parent.style.height = `${pageHeight * scale}px`;
    },

    clearVisualPageBreaks() {
      if (!_container) return;
      _container.querySelectorAll('.preview-page-break-container, .preview-overflow-line').forEach((el) => el.remove());
    },

    measureContentHeight() {
      if (!_container) return 0;
      const guides = Array.from(_container.querySelectorAll('.preview-page-break-container, .preview-overflow-line'));
      guides.forEach((guide) => guide.remove());

      const pageEl = getPageElement();
      const originalHeight = _container.style.height;
      const originalMinHeight = _container.style.minHeight;
      const originalOverflow = _container.style.overflow;
      const originalTransform = _container.style.transform;

      try {
        _container.style.height = 'auto';
        _container.style.minHeight = '0';
        _container.style.overflow = 'visible';
        _container.style.transform = 'none';
        forceLayout(pageEl);

        const containerHeight = _container.scrollHeight;
        const renderedHeight = measureRenderedHeight(pageEl);
        if (!pageEl || pageEl === _container) {
          return Math.ceil(Math.max(containerHeight, renderedHeight));
        }

        const pageHeight = pageEl.scrollHeight + getContainerPaddingHeight();
        return Math.ceil(Math.max(containerHeight, pageHeight, renderedHeight));
      } finally {
        _container.style.height = originalHeight;
        _container.style.minHeight = originalMinHeight;
        _container.style.overflow = originalOverflow;
        _container.style.transform = originalTransform;
        guides.forEach((guide) => _container.appendChild(guide));
      }
    },

    getPageCount() {
      return Math.max(1, Math.ceil(this.measureContentHeight() / A4_HEIGHT_PX));
    },

    isOverflowing() {
      return this.measureContentHeight() > A4_HEIGHT_PX + OVERFLOW_TOLERANCE_PX;
    },

    applyVisualPageBreaks() {
      if (!_container) return;
      this.clearVisualPageBreaks();
      if (this.measureContentHeight() <= A4_HEIGHT_PX + OVERFLOW_TOLERANCE_PX) return;

      const line = document.createElement('div');
      line.className = 'preview-overflow-line';
      line.style.top = `${A4_HEIGHT_PX}px`;
      line.dataset.label = '⚠ 此线以下超出一页，打印 / PDF 将被裁剪';
      _container.appendChild(line);
    },

    destroy() {
      if (_resizeObserver) {
        _resizeObserver.disconnect();
        _resizeObserver = null;
      }
      if (_layoutFrame) {
        cancelAnimationFrame(_layoutFrame);
        _layoutFrame = null;
      }
    }
  };
})();

window.ResumePreview = ResumePreview;
