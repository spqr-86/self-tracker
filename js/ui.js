/**
 * UI Module - уведомления и вспомогательные функции UI
 */

class UIManager {
  constructor() {
    this.createNotificationContainer();
  }

  /**
   * Создание контейнера для уведомлений
   */
  createNotificationContainer() {
    if (!document.getElementById('notifications')) {
      const container = document.createElement('div');
      container.id = 'notifications';
      container.className = 'notifications';
      document.body.appendChild(container);
    }
  }

  /**
   * Показать уведомление
   */
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[type] || 'ℹ';

    notification.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${this.escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Закрыть уведомление">×</button>
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.removeNotification(notification));

    container.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => this.removeNotification(notification), 5000);

    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
  }

  /**
   * Удалить уведомление
   */
  removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Экранирование HTML для защиты от XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Показать ошибку
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Показать успех
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Показать предупреждение
   */
  showWarning(message) {
    this.showNotification(message, 'warning');
  }

  /**
   * Показать информацию
   */
  showInfo(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Очистка формы
   */
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type === 'date') {
        input.value = new Date().toISOString().split('T')[0];
      } else if (input.type === 'number') {
        input.value = '';
      } else if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
  }

  /**
   * Установка текущей даты в поле
   */
  setTodayDate(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Переключение секций с обновлением навигации
   */
  showSection(sectionId, event) {
    console.log('[UI] Переключение на секцию:', sectionId);

    // Скрыть все секции
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');

    // Показать нужную секцию
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
    }

    // Обновить активную кнопку
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    if (event && event.target) {
      event.target.classList.add('active');
    }

    // Автоматически свернуть меню на мобильных
    const nav = document.getElementById('main-nav');
    const hamburger = document.getElementById('menu-toggle');
    if (nav && nav.classList.contains('nav-closed') === false) {
      // Меню открыто, закрываем его
      nav.classList.add('nav-closed');
      if (hamburger) {
        hamburger.classList.remove('active');
      }
    }
  }

  /**
   * Создание кнопки удаления
   */
  createDeleteButton(id, onDelete) {
    const btn = document.createElement('button');
    btn.className = 'btn-delete';
    btn.textContent = '✕';
    btn.setAttribute('aria-label', 'Удалить запись');
    btn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Удалить эту запись?')) {
        onDelete(id);
      }
    };
    return btn;
  }

  /**
   * Создание кнопки редактирования
   */
  createEditButton(id, onEdit) {
    const btn = document.createElement('button');
    btn.className = 'btn-edit';
    btn.textContent = '✎';
    btn.setAttribute('aria-label', 'Редактировать запись');
    btn.onclick = (e) => {
      e.stopPropagation();
      onEdit(id);
    };
    return btn;
  }

  /**
   * Форматирование даты
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Создание progress bar
   */
  createProgressBar(value, max = 100) {
    const progress = document.createElement('progress');
    progress.max = max;
    progress.value = value;
    progress.setAttribute('aria-label', `Прогресс ${value}%`);
    return progress;
  }

  /**
   * Создание YouTube preview
   */
  createYoutubePreview(url) {
    if (!url || url.trim() === '') return null;

    // Нормализация URL
    url = url.trim();

    // Извлечение ID видео из URL
    let videoId = null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/i,
      /youtube\.com\/shorts\/([^&?#]+)/i
    ];

    for (let pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    // Создание ссылки (даже если ID не извлечен, показываем ссылку)
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'youtube-link';
    link.textContent = videoId ? '▶ Видео' : '🔗 Ссылка';
    link.setAttribute('aria-label', 'Открыть видео на YouTube');

    return link;
  }

  /**
   * Debounce функция для оптимизации
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Экспорт singleton
const ui = new UIManager();
