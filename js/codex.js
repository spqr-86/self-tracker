/**
 * NEXUS OS - Codex Module
 * Управление персональным кодексом с поддержкой Markdown и режима чтения
 */

let isReadingMode = false;
let isPreviewMode = false;

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

  if (isPreviewMode) {
    // Render Markdown
    const text = textarea.value || '';
    const html = marked.parse(text);
    preview.innerHTML = html;

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
