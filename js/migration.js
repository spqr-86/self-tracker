/**
 * Migration Module - миграция данных между версиями
 * NEXUS OS v3.0
 */

class DataMigration {
  constructor() {
    this.BACKUP_KEY = 'nexusBackup_v2';
    this.MIGRATION_FLAG = 'nexusMigrationCompleted';
    this.CURRENT_VERSION = 3;
  }

  /**
   * Проверить, нужна ли миграция
   */
  needsMigration() {
    // Если миграция уже выполнена
    if (localStorage.getItem(this.MIGRATION_FLAG) === 'true') {
      return false;
    }

    // Проверяем наличие старых данных (v2)
    const hasOldStats = localStorage.getItem('nexusStats') !== null;
    const hasOldPerks = localStorage.getItem('nexusUnlockedPerks') !== null;

    // Проверяем, есть ли уже новое состояние
    const gameStateRaw = localStorage.getItem('nexusGameState');
    if (gameStateRaw) {
      try {
        const state = JSON.parse(gameStateRaw);
        if (state.dataVersion === this.CURRENT_VERSION) {
          return false;
        }
      } catch (e) {
        // Если не удалось распарсить — нужна миграция
      }
    }

    return hasOldStats || hasOldPerks;
  }

  /**
   * Создать бэкап всех данных v2
   */
  createBackup() {
    console.log('[Migration] Создание бэкапа v2 данных...');

    const backup = {
      timestamp: new Date().toISOString(),
      version: 2,
      data: {}
    };

    // Список ключей v2
    const v2Keys = [
      'workouts',
      'meditations',
      'code',
      'goals',
      'achievements',
      'program',
      'testResults',
      'nexusStats',
      'nexusUnlockedPerks',
      'nexusWeightHistory',
      'nexusWeightGoal',
      'nexusPHQ15History',
      'nexusPersonalCodeText',
      'nexusTheme',
      'codexReadingMode'
    ];

    v2Keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          backup.data[key] = JSON.parse(value);
        } catch (e) {
          // Если не JSON — сохраняем как строку
          backup.data[key] = value;
        }
      }
    });

    // Сохраняем бэкап
    try {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
      console.log('[Migration] Бэкап создан:', Object.keys(backup.data).length, 'ключей');
      return true;
    } catch (e) {
      console.error('[Migration] Ошибка создания бэкапа:', e);
      return false;
    }
  }

  /**
   * Выполнить миграцию v2 → v3
   */
  migrate() {
    console.log('[Migration] Начало миграции v2 → v3...');

    // 1. Создаём бэкап
    if (!this.createBackup()) {
      console.error('[Migration] Не удалось создать бэкап. Миграция отменена.');
      return false;
    }

    try {
      // 2. Мигрируем статы в начальные значения перков (для будущей Фазы 2)
      const oldStats = this.getOldStats();
      if (oldStats) {
        const convertedPerks = this.convertStatsToPerks(oldStats);
        localStorage.setItem('nexusPerksLegacy', JSON.stringify({
          migrated: true,
          timestamp: new Date().toISOString(),
          originalStats: oldStats,
          convertedPerks: convertedPerks
        }));
        console.log('[Migration] Статы сконвертированы в legacy-перки');
      }

      // 3. Сохраняем старые перки как legacy
      const oldPerks = localStorage.getItem('nexusUnlockedPerks');
      if (oldPerks) {
        localStorage.setItem('nexusOldPerks', oldPerks);
        console.log('[Migration] Старые перки сохранены как legacy');
      }

      // 4. Инициализируем новое игровое состояние
      // (GameStateManager сделает это сам при загрузке)

      // 5. Помечаем миграцию как завершённую
      localStorage.setItem(this.MIGRATION_FLAG, 'true');
      localStorage.setItem('nexusMigrationDate', new Date().toISOString());

      console.log('[Migration] Миграция успешно завершена!');
      return true;

    } catch (e) {
      console.error('[Migration] Ошибка миграции:', e);
      return false;
    }
  }

  /**
   * Получить старые статы
   */
  getOldStats() {
    const raw = localStorage.getItem('nexusStats');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Конвертировать старые статы (STR/PER/INT/WIL) в базовые значения перков
   */
  convertStatsToPerks(oldStats) {
    const result = {};

    // Формула: уровень стата (1-10) → начальное значение перка (1-10)
    // XP не учитываем, берём только уровень

    if (oldStats.STR) {
      result.strength = Math.min(10, Math.max(1, oldStats.STR.value || 1));
      result.endurance = Math.min(10, Math.max(1, oldStats.STR.value || 1));
    }

    if (oldStats.PER) {
      result.perception = Math.min(10, Math.max(1, oldStats.PER.value || 1));
    }

    if (oldStats.INT) {
      result.intelligence = Math.min(10, Math.max(1, oldStats.INT.value || 1));
      result.agility = Math.min(10, Math.max(1, Math.floor((oldStats.INT.value || 1) * 0.8)));
    }

    if (oldStats.WIL) {
      result.charisma = Math.min(10, Math.max(1, oldStats.WIL.value || 1));
      result.luck = Math.min(10, Math.max(1, Math.floor((oldStats.WIL.value || 1) * 0.9)));
    }

    return result;
  }

  /**
   * Откатить миграцию (восстановить из бэкапа)
   */
  rollback() {
    console.log('[Migration] Откат миграции...');

    const backupRaw = localStorage.getItem(this.BACKUP_KEY);
    if (!backupRaw) {
      console.error('[Migration] Бэкап не найден');
      return false;
    }

    try {
      const backup = JSON.parse(backupRaw);

      // Восстанавливаем все данные
      Object.keys(backup.data).forEach(key => {
        const value = backup.data[key];
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      // Удаляем данные v3
      localStorage.removeItem('nexusGameState');
      localStorage.removeItem('nexusPerksLegacy');
      localStorage.removeItem(this.MIGRATION_FLAG);
      localStorage.removeItem('nexusMigrationDate');

      console.log('[Migration] Откат завершён');
      return true;

    } catch (e) {
      console.error('[Migration] Ошибка отката:', e);
      return false;
    }
  }

  /**
   * Экспортировать бэкап как файл
   */
  exportBackup() {
    const backupRaw = localStorage.getItem(this.BACKUP_KEY);
    if (!backupRaw) {
      alert('Бэкап не найден');
      return;
    }

    try {
      const blob = new Blob([backupRaw], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nexus-backup-v2-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error('[Migration] Ошибка экспорта:', e);
    }
  }

  /**
   * Получить информацию о миграции
   */
  getMigrationInfo() {
    return {
      needsMigration: this.needsMigration(),
      migrationCompleted: localStorage.getItem(this.MIGRATION_FLAG) === 'true',
      migrationDate: localStorage.getItem('nexusMigrationDate'),
      hasBackup: localStorage.getItem(this.BACKUP_KEY) !== null,
      currentVersion: this.CURRENT_VERSION
    };
  }

  /**
   * Показать информацию о миграции в консоли
   */
  logInfo() {
    const info = this.getMigrationInfo();
    console.log('[Migration] Информация о миграции:', info);
    return info;
  }
}

// Экспорт singleton
const dataMigration = new DataMigration();

// Автоматическая проверка при загрузке
document.addEventListener('DOMContentLoaded', () => {
  if (dataMigration.needsMigration()) {
    console.log('[Migration] Обнаружены данные v2. Требуется миграция.');

    // Можно показать модалку с предложением миграции
    // Или мигрировать автоматически
    if (confirm('Обнаружены данные предыдущей версии. Выполнить миграцию на v3?\n\nБэкап будет создан автоматически.')) {
      if (dataMigration.migrate()) {
        alert('Миграция успешно завершена!');
        location.reload();
      } else {
        alert('Ошибка миграции. Данные сохранены.');
      }
    }
  }
});
