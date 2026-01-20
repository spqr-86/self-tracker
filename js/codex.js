/**
 * NEXUS OS - Codex Module
 * Управление персональным кодексом с поддержкой Markdown и режима чтения
 */

let isReadingMode = false;
let isPreviewMode = false;
let codexSections = [];
let activeCodexSection = 0;

/**
 * Парсинг секций из markdown текста
 * Ищет заголовки # (h1) и создаёт массив секций
 */
function parseCodexSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  lines.forEach((line, index) => {
    // Ищем заголовки первого уровня: # Заголовок
    const h1Match = line.match(/^#\s+(.+)$/);

    if (h1Match) {
      // Сохраняем предыдущую секцию
      if (currentSection) {
        sections.push(currentSection);
      }
      // Начинаем новую секцию
      currentSection = {
        title: h1Match[1].trim(),
        startLine: index,
        content: line
      };
    } else if (currentSection) {
      currentSection.content += '\n' + line;
    } else {
      // Контент до первого заголовка - создаём секцию "Введение"
      if (!currentSection && line.trim()) {
        currentSection = {
          title: 'НАЧАЛО',
          startLine: 0,
          content: line
        };
      } else if (currentSection) {
        currentSection.content += '\n' + line;
      }
    }
  });

  // Добавляем последнюю секцию
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Рендеринг табов из секций
 */
function renderCodexTabs() {
  const tabsContainer = document.getElementById('codex-tabs');
  if (!tabsContainer) return;

  const textarea = document.getElementById('personal-code-text');
  const text = textarea ? textarea.value : '';

  codexSections = parseCodexSections(text);

  // Если меньше 2 секций — не показываем табы
  if (codexSections.length < 2) {
    tabsContainer.style.display = 'none';
    return;
  }

  // Генерируем табы
  tabsContainer.innerHTML = codexSections.map((section, index) => `
    <button
      class="codex-tab ${index === activeCodexSection ? 'active' : ''}"
      onclick="navigateToCodexSection(${index})"
      title="${section.title}"
    >
      ${section.title.length > 15 ? section.title.substring(0, 15) + '…' : section.title}
    </button>
  `).join('');

  tabsContainer.style.display = 'flex';
}

/**
 * Навигация к секции
 */
function navigateToCodexSection(index) {
  if (index < 0 || index >= codexSections.length) return;

  activeCodexSection = index;

  // Обновляем активный таб
  const tabs = document.querySelectorAll('.codex-tab');
  tabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  const preview = document.getElementById('personal-code-preview');
  if (!preview || !isPreviewMode) return;

  // Проверяем, есть ли секция "НАЧАЛО" (контент до первого h1)
  const hasIntroSection = codexSections.length > 0 && codexSections[0].title === 'НАЧАЛО';

  // Если первая секция — скроллим к началу
  if (index === 0) {
    preview.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Ищем соответствующий h1 в превью
  // Если есть intro секция, индекс h1 = index - 1
  const headers = preview.querySelectorAll('h1');
  const headerIndex = hasIntroSection ? index - 1 : index;

  if (headers[headerIndex]) {
    headers[headerIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Подсветка секции на момент
    headers[headerIndex].classList.add('codex-highlight');
    setTimeout(() => {
      headers[headerIndex].classList.remove('codex-highlight');
    }, 1500);
  }
}

/**
 * Toggle Reading Mode - улучшенная читаемость
 */
function toggleReadingMode() {
  isReadingMode = !isReadingMode;
  const screen = document.querySelector('.pipboy-screen');
  const btn = document.getElementById('reading-mode-btn');

  if (isReadingMode) {
    screen.classList.add('reading-mode');
    btn.classList.add('active');
    btn.innerHTML = '👁️ ЧТЕНИЕ ✓';
    localStorage.setItem('codexReadingMode', 'true');
  } else {
    screen.classList.remove('reading-mode');
    btn.classList.remove('active');
    btn.innerHTML = '👁️ ЧТЕНИЕ';
    localStorage.removeItem('codexReadingMode');
  }
}

/**
 * Toggle Preview Mode - просмотр Markdown
 */
function togglePreviewMode() {
  isPreviewMode = !isPreviewMode;
  const textarea = document.getElementById('personal-code-text');
  const preview = document.getElementById('personal-code-preview');
  const btn = document.getElementById('preview-mode-btn');
  const indicator = document.getElementById('codex-mode-indicator');
  const tabsContainer = document.getElementById('codex-tabs');

  if (isPreviewMode) {
    // Render Markdown
    const text = textarea.value || '';
    const html = marked.parse(text);
    preview.innerHTML = html;

    // Рендерим табы
    renderCodexTabs();

    // Switch display
    textarea.style.display = 'none';
    preview.style.display = 'block';

    // Update UI
    btn.classList.add('active');
    btn.innerHTML = '✏️ EDIT';
    indicator.textContent = 'PREVIEW';

  } else {
    // Switch back to edit
    textarea.style.display = 'block';
    preview.style.display = 'none';

    // Скрываем табы в режиме редактирования
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
    }

    // Update UI
    btn.classList.remove('active');
    btn.innerHTML = '📖 PREVIEW';
    indicator.textContent = 'EDIT';
  }
}

/**
 * Load Reading Mode state from localStorage
 */
function loadReadingModeState() {
  const saved = localStorage.getItem('codexReadingMode');
  if (saved === 'true') {
    isReadingMode = false; // Set to false so toggle will activate it
    toggleReadingMode();
  }
}

/**
 * Initialize codex on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Load reading mode state
  loadReadingModeState();

  // Auto-update preview when typing (debounced)
  const textarea = document.getElementById('personal-code-text');
  if (textarea) {
    let debounceTimer;
    textarea.addEventListener('input', () => {
      if (isPreviewMode) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const text = textarea.value || '';
          const html = marked.parse(text);
          const preview = document.getElementById('personal-code-preview');
          if (preview) {
            preview.innerHTML = html;
          }
        }, 300); // Update preview 300ms after typing stops
      }
    });
  }
});
