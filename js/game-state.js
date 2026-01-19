/**
 * Game State Module - управление режимами и игровым состоянием
 * NEXUS OS v3.0
 */

class GameStateManager {
  constructor() {
    this.STORAGE_KEY = 'nexusGameState';
    this.DATA_VERSION = 3;

    // Режимы работы
    this.MODES = {
      NORM: 'norm',
      MINIMUM: 'minimum',
      CRISIS: 'crisis'
    };

    // Конфигурация режимов
    this.MODE_CONFIG = {
      norm: {
        name: 'Норма',
        nameEn: 'NORM',
        icon: '▓',
        color: 'var(--nexus-green)',
        description: 'Стандартный режим — жить "как надо"'
      },
      minimum: {
        name: 'Минимум',
        nameEn: 'MINIMUM',
        icon: '░',
        color: 'var(--nexus-amber)',
        description: 'Режим восстановления — только базовое'
      },
      crisis: {
        name: 'Кризис',
        nameEn: 'CRISIS',
        icon: '▒',
        color: '#ff4444',
        description: 'Экстренный режим — сон, еда, поддержка'
      }
    };

    // Дефолтное состояние
    this.defaultState = {
      dataVersion: this.DATA_VERSION,
      currentMode: this.MODES.NORM,
      modeHistory: [],
      lastModeChange: null,
      lastVisit: null,
      settings: {
        weeklyCheckDay: 0, // 0 = воскресенье
        showWelcomeBack: true,
        daysAwayThreshold: 2
      }
    };

    this.state = null;
    this.load();
  }

  /**
   * Проверка доступности localStorage
   */
  isStorageAvailable() {
    try {
      const test = '__gamestate_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Загрузка состояния
   */
  load() {
    console.log('[GameState] Загрузка состояния...');

    if (!this.isStorageAvailable()) {
      console.warn('[GameState] localStorage недоступен');
      this.state = { ...this.defaultState };
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        // Проверка версии данных
        if (parsed.dataVersion !== this.DATA_VERSION) {
          console.log(`[GameState] Миграция данных v${parsed.dataVersion} → v${this.DATA_VERSION}`);
          this.state = this.migrate(parsed);
        } else {
          this.state = { ...this.defaultState, ...parsed };
        }
      } else {
        console.log('[GameState] Первый запуск — инициализация');
        this.state = { ...this.defaultState };
        this.state.modeHistory.push({
          date: this.getTodayDate(),
          mode: this.MODES.NORM,
          timestamp: new Date().toISOString()
        });
      }

      // Обновляем время последнего визита
      const previousVisit = this.state.lastVisit;
      this.state.lastVisit = new Date().toISOString();
      this.save();

      // Проверяем, нужно ли показать "С возвращением"
      if (previousVisit) {
        const daysSince = this.getDaysSince(previousVisit);
        if (daysSince >= this.state.settings.daysAwayThreshold) {
          this.shouldShowWelcomeBack = true;
          this.daysAway = daysSince;
        }
      }

      console.log('[GameState] Состояние загружено:', this.state);

    } catch (e) {
      console.error('[GameState] Ошибка загрузки:', e);
      this.state = { ...this.defaultState };
    }
  }

  /**
   * Сохранение состояния
   */
  save() {
    if (!this.isStorageAvailable()) {
      console.warn('[GameState] Невозможно сохранить — localStorage недоступен');
      return false;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error('[GameState] Ошибка сохранения:', e);
      return false;
    }
  }

  /**
   * Миграция данных со старых версий
   */
  migrate(oldData) {
    const newState = { ...this.defaultState };

    // Сохраняем то, что можно перенести
    if (oldData.currentMode && Object.values(this.MODES).includes(oldData.currentMode)) {
      newState.currentMode = oldData.currentMode;
    }

    if (Array.isArray(oldData.modeHistory)) {
      newState.modeHistory = oldData.modeHistory;
    }

    if (oldData.lastModeChange) {
      newState.lastModeChange = oldData.lastModeChange;
    }

    if (oldData.settings) {
      newState.settings = { ...newState.settings, ...oldData.settings };
    }

    console.log('[GameState] Миграция завершена');
    return newState;
  }

  /**
   * Получить текущий режим
   */
  getMode() {
    return this.state.currentMode;
  }

  /**
   * Получить конфигурацию текущего режима
   */
  getModeConfig(mode = null) {
    const m = mode || this.state.currentMode;
    return this.MODE_CONFIG[m] || this.MODE_CONFIG.norm;
  }

  /**
   * Установить режим
   */
  setMode(newMode, reason = null) {
    if (!Object.values(this.MODES).includes(newMode)) {
      console.error('[GameState] Неизвестный режим:', newMode);
      return false;
    }

    const oldMode = this.state.currentMode;

    if (oldMode === newMode) {
      console.log('[GameState] Режим не изменился');
      return true;
    }

    // Обновляем состояние
    this.state.currentMode = newMode;
    this.state.lastModeChange = new Date().toISOString();

    // Добавляем в историю
    this.state.modeHistory.push({
      date: this.getTodayDate(),
      mode: newMode,
      previousMode: oldMode,
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Ограничиваем историю (последние 365 дней)
    if (this.state.modeHistory.length > 365) {
      this.state.modeHistory = this.state.modeHistory.slice(-365);
    }

    if (this.save()) {
      console.log(`[GameState] Режим изменён: ${oldMode} → ${newMode}`);

      // Вызываем callback если установлен
      if (this.onModeChange) {
        this.onModeChange(newMode, oldMode);
      }

      return true;
    }

    return false;
  }

  /**
   * Получить историю режимов
   */
  getModeHistory(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return this.state.modeHistory.filter(entry => entry.date >= cutoffStr);
  }

  /**
   * Получить статистику режимов за период
   */
  getModeStats(days = 30) {
    const history = this.getModeHistory(days);

    const stats = {
      norm: 0,
      minimum: 0,
      crisis: 0,
      total: 0
    };

    // Группируем по дням (один режим на день — последний)
    const byDay = {};
    history.forEach(entry => {
      byDay[entry.date] = entry.mode;
    });

    Object.values(byDay).forEach(mode => {
      stats[mode]++;
      stats.total++;
    });

    // Считаем проценты
    if (stats.total > 0) {
      stats.normPercent = Math.round((stats.norm / stats.total) * 100);
      stats.minimumPercent = Math.round((stats.minimum / stats.total) * 100);
      stats.crisisPercent = Math.round((stats.crisis / stats.total) * 100);
    } else {
      stats.normPercent = stats.minimumPercent = stats.crisisPercent = 0;
    }

    return stats;
  }

  /**
   * Получить последние N дней режимов для отображения
   */
  getRecentModes(days = 7) {
    const result = [];
    const today = new Date();

    // Создаём map история по датам
    const historyMap = {};
    this.state.modeHistory.forEach(entry => {
      historyMap[entry.date] = entry.mode;
    });

    // Заполняем последние N дней
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        mode: historyMap[dateStr] || this.MODES.NORM,
        dayName: this.getDayShortName(date.getDay())
      });
    }

    return result;
  }

  /**
   * Проверка сигналов (длительный минимум/кризис)
   */
  checkSignals() {
    const signals = [];
    const history = this.getModeHistory(30);

    // Считаем последовательные дни в минимуме/кризисе
    let consecutiveMinimum = 0;
    let consecutiveCrisis = 0;

    // Берём последние записи
    const recent = history.slice(-10);
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i].mode === this.MODES.MINIMUM) {
        consecutiveMinimum++;
      } else if (recent[i].mode === this.MODES.CRISIS) {
        consecutiveCrisis++;
      } else {
        break;
      }
    }

    // Сигнал: 5+ дней в минимуме
    if (consecutiveMinimum >= 5) {
      signals.push({
        type: 'warning',
        message: 'Минимум уже ' + consecutiveMinimum + ' дней подряд. Может, Норма слишком жёсткая?',
        action: 'review_norm'
      });
    }

    // Сигнал: 3+ дня в кризисе
    if (consecutiveCrisis >= 3) {
      signals.push({
        type: 'alert',
        message: 'Кризис уже ' + consecutiveCrisis + ' дня. Время сказать кому-то. Ты не один.',
        action: 'seek_support'
      });
    }

    // Сигнал: минимум >30% за месяц
    const stats = this.getModeStats(30);
    if (stats.minimumPercent > 30) {
      signals.push({
        type: 'info',
        message: 'Минимум был ' + stats.minimumPercent + '% времени за месяц. Возможно, стоит пересмотреть стандарт Нормы.',
        action: 'adjust_norm'
      });
    }

    return signals;
  }

  /**
   * Получить текущую дату в формате YYYY-MM-DD
   */
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Получить количество дней с даты
   */
  getDaysSince(isoDateString) {
    const then = new Date(isoDateString);
    const now = new Date();
    const diffTime = Math.abs(now - then);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Короткое название дня недели
   */
  getDayShortName(dayIndex) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
  }

  /**
   * Получить данные для приветственного экрана
   */
  getWelcomeBackData() {
    if (!this.shouldShowWelcomeBack) {
      return null;
    }

    // Сбрасываем флаг
    this.shouldShowWelcomeBack = false;

    return {
      daysAway: this.daysAway,
      currentMode: this.state.currentMode,
      modeConfig: this.getModeConfig()
    };
  }

  /* =====================
     SACRED COW - Священная корова
     3-5 попыток/неделю сделать шаг к цели
  ===================== */

  /**
   * Получить начало текущей недели (понедельник)
   */
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }

  /**
   * Получить попытки священной коровы за текущую неделю
   */
  getSacredCowAttempts() {
    const weekStart = this.getWeekStart();

    if (!this.state.sacredCow) {
      this.state.sacredCow = {};
    }

    if (!this.state.sacredCow[weekStart]) {
      this.state.sacredCow[weekStart] = [];
    }

    return this.state.sacredCow[weekStart];
  }

  /**
   * Получить количество попыток за текущую неделю
   */
  getSacredCowCount() {
    return this.getSacredCowAttempts().length;
  }

  /**
   * Добавить попытку священной коровы
   */
  addSacredCowAttempt(note = '') {
    const weekStart = this.getWeekStart();

    if (!this.state.sacredCow) {
      this.state.sacredCow = {};
    }

    if (!this.state.sacredCow[weekStart]) {
      this.state.sacredCow[weekStart] = [];
    }

    // Ограничение: максимум 7 попыток в неделю
    if (this.state.sacredCow[weekStart].length >= 7) {
      console.log('[GameState] Максимум попыток на неделю достигнут');
      return false;
    }

    this.state.sacredCow[weekStart].push({
      date: this.getTodayDate(),
      timestamp: new Date().toISOString(),
      note: note
    });

    // Очистка старых записей (старше 8 недель)
    this.cleanOldSacredCowData();

    if (this.save()) {
      console.log('[GameState] Попытка священной коровы добавлена');

      // Callback если есть
      if (this.onSacredCowUpdate) {
        this.onSacredCowUpdate(this.getSacredCowCount());
      }

      return true;
    }

    return false;
  }

  /**
   * Удалить последнюю попытку (отмена)
   */
  removeSacredCowAttempt() {
    const attempts = this.getSacredCowAttempts();

    if (attempts.length === 0) {
      return false;
    }

    attempts.pop();

    if (this.save()) {
      if (this.onSacredCowUpdate) {
        this.onSacredCowUpdate(this.getSacredCowCount());
      }
      return true;
    }

    return false;
  }

  /**
   * Очистка старых данных священной коровы
   */
  cleanOldSacredCowData() {
    if (!this.state.sacredCow) return;

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const cutoff = this.getWeekStart(eightWeeksAgo);

    Object.keys(this.state.sacredCow).forEach(weekStart => {
      if (weekStart < cutoff) {
        delete this.state.sacredCow[weekStart];
      }
    });
  }

  /**
   * Получить статус священной коровы (для UI)
   */
  getSacredCowStatus() {
    const count = this.getSacredCowCount();
    const target = { min: 3, max: 5 };

    let status = 'low'; // меньше 3
    let message = 'Сделай попытку сегодня';

    if (count >= target.min && count <= target.max) {
      status = 'good'; // 3-5 - идеально
      message = 'Отличный темп!';
    } else if (count > target.max) {
      status = 'high'; // больше 5 - перерабатываешь
      message = 'Не перегружай себя';
    } else if (count > 0) {
      status = 'progress'; // 1-2 - в процессе
      message = `Ещё ${target.min - count} до цели`;
    }

    return {
      count,
      target,
      status,
      message,
      progress: Math.min(100, Math.round((count / target.max) * 100))
    };
  }

  /**
   * Экспорт состояния для бэкапа
   */
  exportState() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Импорт состояния из бэкапа
   */
  importState(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      // Валидация
      if (!imported.dataVersion || !imported.currentMode) {
        throw new Error('Неверный формат данных');
      }

      this.state = this.migrate(imported);
      return this.save();
    } catch (e) {
      console.error('[GameState] Ошибка импорта:', e);
      return false;
    }
  }

  /**
   * Сброс к начальному состоянию
   */
  reset() {
    if (!confirm('Сбросить игровое состояние? Это удалит историю режимов.')) {
      return false;
    }

    this.state = { ...this.defaultState };
    this.state.modeHistory.push({
      date: this.getTodayDate(),
      mode: this.MODES.NORM,
      timestamp: new Date().toISOString()
    });

    return this.save();
  }
}

// Экспорт singleton
const gameState = new GameStateManager();
