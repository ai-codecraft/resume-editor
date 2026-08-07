/**
 * dragdrop.js - 拖拽排序模块
 * 使用 HTML5 Drag and Drop API 实现编辑器中的模块与条目排序
 */

const DragDrop = {
  /**
   * 初始化拖拽排序
   * @param {HTMLElement} container - 包含可拖拽子元素的父容器
   * @param {string} handleSelector - 拖拽手柄的 CSS 选择器
   * @param {Function} onReorder - 排序完成回调 (fromIndex, toIndex)
   */
  init(container, handleSelector, onReorder) {
    if (!container) return;

    let draggedEl = null;
    let draggedIndex = -1;
    let placeholder = null;

    // 获取可拖拽的直接子元素列表
    const getDraggableChildren = () => {
      return Array.from(container.children).filter(
        (child) => !child.classList.contains('drag-placeholder') && child.getAttribute('draggable') === 'true'
      );
    };

    // 获取元素在兄弟中的索引
    const getIndex = (el) => {
      const children = getDraggableChildren();
      return children.indexOf(el);
    };

    // 找到最近的可拖拽父元素
    const findDraggableParent = (el) => {
      while (el && el !== container) {
        if (el.parentElement === container && el.getAttribute('draggable') === 'true') {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    // 创建占位符
    const createPlaceholder = (height) => {
      const ph = document.createElement('div');
      ph.className = 'drag-placeholder';
      ph.style.height = height + 'px';
      ph.style.border = '2px dashed var(--border-color, #555)';
      ph.style.borderRadius = '8px';
      ph.style.margin = '4px 0';
      ph.style.transition = 'height 0.2s ease';
      ph.style.background = 'var(--hover-bg, rgba(99,102,241,0.08))';
      return ph;
    };

    // 根据鼠标位置计算插入位置
    const getInsertPosition = (e) => {
      const children = getDraggableChildren();
      let closest = null;
      let closestOffset = Number.NEGATIVE_INFINITY;

      for (const child of children) {
        if (child === draggedEl) continue;
        const rect = child.getBoundingClientRect();
        const offset = e.clientY - (rect.top + rect.height / 2);
        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closest = child;
        }
      }
      return closest;
    };

    // ---- 事件：鼠标按下拖拽手柄 ----
    container.addEventListener('mousedown', (e) => {
      const handle = e.target.closest(handleSelector);
      if (!handle) return;
      const draggable = findDraggableParent(handle);
      if (draggable) {
        draggable.setAttribute('draggable', 'true');
      }
    });

    // 确保所有子元素默认可拖拽（通过手柄）
    const setupDraggable = () => {
      Array.from(container.children).forEach((child) => {
        if (!child.classList.contains('drag-placeholder')) {
          child.setAttribute('draggable', 'true');
        }
      });
    };
    setupDraggable();

    // 使用 MutationObserver 自动设置新子元素
    const observer = new MutationObserver(() => {
      setupDraggable();
    });
    observer.observe(container, { childList: true });

    // ---- dragstart ----
    container.addEventListener('dragstart', (e) => {
      const handle = e.target.closest(handleSelector);
      // 只允许通过手柄拖拽
      if (!handle) {
        e.preventDefault();
        return;
      }

      draggedEl = findDraggableParent(e.target);
      if (!draggedEl) {
        e.preventDefault();
        return;
      }

      draggedIndex = getIndex(draggedEl);

      // 设置拖拽数据
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedIndex.toString());

      // 延迟添加 dragging 类以保留拖拽图像
      requestAnimationFrame(() => {
        if (draggedEl) {
          draggedEl.classList.add('dragging');
          // 创建占位符
          const rect = draggedEl.getBoundingClientRect();
          placeholder = createPlaceholder(rect.height);
          draggedEl.parentNode.insertBefore(placeholder, draggedEl);
        }
      });
    });

    // ---- dragover ----
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!draggedEl) return;

      // 移除所有 drag-over 类
      getDraggableChildren().forEach((child) => child.classList.remove('drag-over'));

      // 计算插入位置
      const afterElement = getInsertPosition(e);

      // 移动占位符
      if (placeholder) {
        if (afterElement) {
          container.insertBefore(placeholder, afterElement);
        } else {
          container.appendChild(placeholder);
        }
      }

      // 高亮最近元素
      if (afterElement) {
        afterElement.classList.add('drag-over');
      }
    });

    // ---- dragenter ----
    container.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });

    // ---- dragleave ----
    container.addEventListener('dragleave', (e) => {
      const target = findDraggableParent(e.target);
      if (target) {
        target.classList.remove('drag-over');
      }
    });

    // ---- drop ----
    container.addEventListener('drop', (e) => {
      e.preventDefault();

      if (!draggedEl) return;

      // 移除所有视觉反馈
      getDraggableChildren().forEach((child) => child.classList.remove('drag-over'));
      draggedEl.classList.remove('dragging');

      // 移除占位符并插入被拖拽元素
      if (placeholder && placeholder.parentNode) {
        container.insertBefore(draggedEl, placeholder);
        placeholder.parentNode.removeChild(placeholder);
      }

      // 计算新索引
      const newIndex = getIndex(draggedEl);

      // 触发回调
      if (draggedIndex !== newIndex && draggedIndex !== -1 && newIndex !== -1) {
        onReorder(draggedIndex, newIndex);
      }

      // 添加落地动画
      draggedEl.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
      draggedEl.style.transform = 'scale(1.02)';
      setTimeout(() => {
        if (draggedEl) {
          draggedEl.style.transform = '';
          setTimeout(() => {
            if (draggedEl) {
              draggedEl.style.transition = '';
            }
          }, 200);
        }
      }, 100);

      // 清理状态
      draggedEl = null;
      draggedIndex = -1;
      placeholder = null;
    });

    // ---- dragend ----
    container.addEventListener('dragend', (e) => {
      // 清理所有状态（处理拖拽取消的情况）
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
      }

      getDraggableChildren().forEach((child) => child.classList.remove('drag-over'));

      // 移除占位符
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }

      draggedEl = null;
      draggedIndex = -1;
      placeholder = null;
    });

    // ---- Touch events support for mobile devices ----
    let touchDraggedEl = null;
    let touchDraggedIndex = -1;
    let touchPlaceholder = null;
    let touchStartClientY = 0;
    let touchInitialRect = null;

    container.addEventListener('touchstart', (e) => {
      const handle = e.target.closest(handleSelector);
      if (!handle) return;

      const draggable = findDraggableParent(handle);
      if (!draggable) return;

      e.preventDefault(); // Prevent scrolling

      touchDraggedEl = draggable;
      touchDraggedIndex = getIndex(touchDraggedEl);
      touchInitialRect = touchDraggedEl.getBoundingClientRect();

      // Create placeholder
      touchPlaceholder = createPlaceholder(touchInitialRect.height);
      touchDraggedEl.parentNode.insertBefore(touchPlaceholder, touchDraggedEl);

      // Save start positions
      const touch = e.touches[0];
      touchStartClientY = touch.clientY;

      // Style dragged element to float
      touchDraggedEl.classList.add('dragging');
      touchDraggedEl.style.position = 'fixed';
      touchDraggedEl.style.top = touchInitialRect.top + 'px';
      touchDraggedEl.style.left = touchInitialRect.left + 'px';
      touchDraggedEl.style.width = touchInitialRect.width + 'px';
      touchDraggedEl.style.height = touchInitialRect.height + 'px';
      touchDraggedEl.style.zIndex = '10000';
      touchDraggedEl.style.pointerEvents = 'none';
      touchDraggedEl.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      if (!touchDraggedEl || !touchPlaceholder) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartClientY;
      touchDraggedEl.style.top = (touchInitialRect.top + deltaY) + 'px';

      // Hit-test other elements to see where to insert the placeholder
      const children = getDraggableChildren();
      let closest = null;
      let closestOffset = Number.NEGATIVE_INFINITY;

      for (const child of children) {
        if (child === touchDraggedEl) continue;
        const rect = child.getBoundingClientRect();
        const offset = touch.clientY - (rect.top + rect.height / 2);
        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closest = child;
        }
      }

      // Move placeholder and highlights
      children.forEach((child) => child.classList.remove('drag-over'));
      if (closest) {
        container.insertBefore(touchPlaceholder, closest);
        closest.classList.add('drag-over');
      } else {
        container.appendChild(touchPlaceholder);
      }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      if (!touchDraggedEl) return;
      e.preventDefault();

      // Remove highlights
      getDraggableChildren().forEach((child) => child.classList.remove('drag-over'));

      // Remove float styles
      touchDraggedEl.classList.remove('dragging');
      touchDraggedEl.style.position = '';
      touchDraggedEl.style.top = '';
      touchDraggedEl.style.left = '';
      touchDraggedEl.style.width = '';
      touchDraggedEl.style.height = '';
      touchDraggedEl.style.zIndex = '';
      touchDraggedEl.style.pointerEvents = '';
      touchDraggedEl.style.boxShadow = '';

      // Re-insert at placeholder position
      if (touchPlaceholder && touchPlaceholder.parentNode) {
        container.insertBefore(touchDraggedEl, touchPlaceholder);
        touchPlaceholder.parentNode.removeChild(touchPlaceholder);
      }

      const newIndex = getIndex(touchDraggedEl);
      if (touchDraggedIndex !== newIndex && touchDraggedIndex !== -1 && newIndex !== -1) {
        onReorder(touchDraggedIndex, newIndex);
      }

      // Clean up
      touchDraggedEl = null;
      touchDraggedIndex = -1;
      touchPlaceholder = null;
    }, { passive: false });

    // 返回清理函数
    return {
      destroy() {
        observer.disconnect();
      },
      refresh() {
        setupDraggable();
      }
    };
  }
};

// 挂载到全局
window.DragDrop = DragDrop;
