/**
 * Storage Module - управление данными с localStorage
 */

class StorageManager {
  constructor() {
    this.data = {
      workouts: [],
      meditations: [],
      code: [],
      goals: [],
      achievements: [],
      program: [],
      testResults: []
    };
    this.load();
  }

  /**
   * Проверка доступности localStorage
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Загрузка данных из localStorage с обработкой ошибок
   */
  load() {
    console.log('[Storage] Начало загрузки данных из localStorage');

    if (!this.isStorageAvailable()) {
      console.warn('[Storage] localStorage недоступен. Данные не будут сохранены.');
      return;
    }

    try {
      for (let key in this.data) {
        const stored = localStorage.getItem(key);
        if (stored) {
          this.data[key] = JSON.parse(stored);
          console.log(`[Storage] Загружено ${this.data[key].length} записей для ключа "${key}"`);
        } else {
          console.log(`[Storage] Нет данных для ключа "${key}"`);
        }
      }
      console.log('[Storage] Загрузка данных завершена:', this.data);
    } catch (e) {
      console.error('[Storage] Ошибка загрузки данных:', e);
      this.showError('Не удалось загрузить данные из хранилища');
    }
  }

  /**
   * Сохранение всех данных
   */
  save() {
    if (!this.isStorageAvailable()) {
      this.showError('Хранилище недоступно. Данные не будут сохранены.');
      return false;
    }

    try {
      for (let key in this.data) {
        localStorage.setItem(key, JSON.stringify(this.data[key]));
      }
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this.showError('Превышен лимит хранилища. Удалите старые записи.');
      } else {
        this.showError('Ошибка сохранения данных');
      }
      console.error('Ошибка сохранения:', e);
      return false;
    }
  }

  /**
   * Валидация данных перед сохранением
   */
  validateWorkout(data) {
    if (!data.date) return 'Укажите дату';
    if (!data.exercise || data.exercise.trim() === '') return 'Укажите упражнение';
    if (data.sets && (isNaN(data.sets) || data.sets < 0)) return 'Некорректное число подходов';
    if (data.reps && (isNaN(data.reps) || data.reps < 0)) return 'Некорректное число повторений';
    if (data.weight && (isNaN(data.weight) || data.weight < 0)) return 'Некорректный вес';
    return null;
  }

  validateMeditation(data) {
    if (!data.date) return 'Укажите дату';
    if (!data.minutes || isNaN(data.minutes) || data.minutes <= 0) return 'Укажите корректное время';
    return null;
  }

  validateGoal(data) {
    if (!data.name || data.name.trim() === '') return 'Укажите название цели';
    if (data.progress && (isNaN(data.progress) || data.progress < 0 || data.progress > 100)) {
      return 'Прогресс должен быть от 0 до 100';
    }
    return null;
  }

  validateCode(data) {
    if (!data.text || data.text.trim() === '') return 'Введите текст принципа';
    return null;
  }

  validateAchievement(data) {
    if (!data.text || data.text.trim() === '') return 'Введите описание достижения';
    return null;
  }

  validateProgram(data) {
    if (!data.day) return 'Укажите день недели';
    if (!data.exercise || data.exercise.trim() === '') return 'Укажите упражнение';
    if (!data.sets || isNaN(data.sets) || data.sets < 1) return 'Укажите количество подходов (минимум 1)';
    if (!data.reps || isNaN(data.reps) || data.reps < 1) return 'Укажите количество повторений (минимум 1)';
    if (data.weight === undefined || isNaN(data.weight) || data.weight < 0) return 'Укажите корректный вес';
    return null;
  }

  validateTestResult(data) {
    if (!data.score && data.score !== 0) return 'Отсутствует результат теста';
    if (isNaN(data.score) || data.score < 0 || data.score > 45) return 'Некорректный результат теста';
    return null;
  }
  /**
   * Санитизация текста для защиты от XSS
   */
  sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Добавление записи с валидацией
   */
  add(type, data, validator) {
    const error = validator ? validator(data) : null;
    if (error) {
      this.showError(error);
      return false;
    }

    // Санитизация текстовых полей
    const sanitized = {};
    for (let key in data) {
      if (typeof data[key] === 'string') {
        sanitized[key] = this.sanitize(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    sanitized.id = Date.now() + Math.random(); // Уникальный ID
    this.data[type].push(sanitized);

    if (this.save()) {
      this.showSuccess('Запись добавлена');
      return true;
    }
    return false;
  }

  /**
   * Удаление записи
   */
  delete(type, id) {
    const index = this.data[type].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[type].splice(index, 1);
      if (this.save()) {
        this.showSuccess('Запись удалена');
        return true;
      }
    }
    return false;
  }

  /**
   * Обновление записи
   */
  update(type, id, newData, validator) {
    const error = validator ? validator(newData) : null;
    if (error) {
      this.showError(error);
      return false;
    }

    const index = this.data[type].findIndex(item => item.id === id);
    if (index !== -1) {
      // Санитизация
      for (let key in newData) {
        if (typeof newData[key] === 'string') {
          this.data[type][index][key] = this.sanitize(newData[key]);
        } else {
          this.data[type][index][key] = newData[key];
        }
      }

      if (this.save()) {
        this.showSuccess('Запись обновлена');
        return true;
      }
    }
    return false;
  }

  /**
   * Экспорт данных
   */
  exportData() {
    try {
      const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `selftracker-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      this.showSuccess('Данные экспортированы');
    } catch (e) {
      this.showError('Ошибка экспорта данных');
      console.error(e);
    }
  }

  /**
   * Импорт данных с подтверждением
   */
  importData(callback) {
    if (!confirm('Это перезапишет все текущие данные. Продолжить?')) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);

          // Проверка структуры данных
          const requiredKeys = ['workouts', 'meditations', 'code', 'goals', 'achievements', 'program', 'testResults'];
          const isValid = requiredKeys.every(key => Array.isArray(imported[key]));

          if (!isValid) {
            this.showError('Неверный формат файла');
            return;
          }

          Object.assign(this.data, imported);
          if (this.save()) {
            this.showSuccess('Данные импортированы');
            if (callback) callback();
          }
        } catch (e) {
          this.showError('Ошибка чтения файла');
          console.error(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /**
   * Методы для отображения уведомлений (будут переопределены из UI)
   */
  showError(message) {
    console.error(message);
  }

  showSuccess(message) {
    console.log(message);
  }
}

// Экспорт singleton
const storage = new StorageManager();
