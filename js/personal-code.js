/**
 * NEXUS OS - Personal Code System
 * Система перков и персонального кодекса
 */

class PersonalCodeManager {
  constructor() {
    this.perks = this.initPerks();
    this.unlockedPerks = this.loadUnlockedPerks();
  }

  /**
   * Инициализация всех доступных перков
   */
  initPerks() {
    return {
      // ====== PHYSICAL PERKS ======
      ironBody: {
        id: 'ironBody',
        name: 'ЖЕЛЕЗНОЕ ТЕЛО',
        nameEn: 'Iron Body',
        category: 'PHYSICAL',
        icon: '💪',
        description: 'Твое тело - это храм. +50% XP за тренировки.',
        requirements: { STR: 5 },
        benefits: { workoutXP: 1.5 },
        unlocked: false
      },

      sprinter: {
        id: 'sprinter',
        name: 'СПРИНТЕР',
        nameEn: 'Sprinter',
        category: 'PHYSICAL',
        icon: '🏃',
        description: 'Скорость - это жизнь. Unlock кардио-режима.',
        requirements: { STR: 3 },
        benefits: { cardioMode: true },
        unlocked: false
      },

      eagleEye: {
        id: 'eagleEye',
        name: 'ОРЛИНЫЙ ГЛАЗ',
        nameEn: 'Eagle Eye',
        category: 'PHYSICAL',
        icon: '🎯',
        description: 'Ничто не ускользнет от твоего взгляда. +25% к точности.',
        requirements: { PER: 5 },
        benefits: { focusBonus: 1.25 },
        unlocked: false
      },

      endurance: {
        id: 'endurance',
        name: 'ВЫНОСЛИВОСТЬ',
        nameEn: 'Endurance',
        category: 'PHYSICAL',
        icon: '⚡',
        description: 'Ты можешь идти дальше других. +30% длительность тренировок.',
        requirements: { STR: 7, PER: 3 },
        benefits: { workoutDuration: 1.3 },
        unlocked: false
      },

      // ====== MENTAL PERKS ======
      polyglot: {
        id: 'polyglot',
        name: 'ПОЛИГЛОТ',
        nameEn: 'Polyglot',
        category: 'MENTAL',
        icon: '🗣️',
        description: 'Языки даются тебе легко. Unlock модуля языков.',
        requirements: { INT: 7 },
        benefits: { languageMode: true },
        unlocked: false
      },

      hacker: {
        id: 'hacker',
        name: 'ХАКЕР',
        nameEn: 'Hacker',
        category: 'MENTAL',
        icon: '💻',
        description: 'Код - это твой язык. +50% XP за программирование.',
        requirements: { INT: 5 },
        benefits: { codeXP: 1.5 },
        unlocked: false
      },

      bookworm: {
        id: 'bookworm',
        name: 'КНИЖНЫЙ ЧЕРВЬ',
        nameEn: 'Bookworm',
        category: 'MENTAL',
        icon: '📚',
        description: 'Знание - сила. Unlock читательского дневника.',
        requirements: { INT: 3 },
        benefits: { readingMode: true },
        unlocked: false
      },

      strategist: {
        id: 'strategist',
        name: 'СТРАТЕГ',
        nameEn: 'Strategist',
        category: 'MENTAL',
        icon: '🎲',
        description: 'Ты видишь на 10 шагов вперед. +20% эффективность планирования.',
        requirements: { INT: 8, PER: 5 },
        benefits: { planningBonus: 1.2 },
        unlocked: false
      },

      // ====== SPIRITUAL PERKS ======
      zenMaster: {
        id: 'zenMaster',
        name: 'МАСТЕР ДЗЕН',
        nameEn: 'Zen Master',
        category: 'SPIRITUAL',
        icon: '🧘',
        description: 'Внутренний покой - твоя сила. Двойной эффект медитаций.',
        requirements: { WIL: 7 },
        benefits: { meditationXP: 2.0 },
        unlocked: false
      },

      earlyBird: {
        id: 'earlyBird',
        name: 'РАННЯЯ ПТИЦА',
        nameEn: 'Early Bird',
        category: 'SPIRITUAL',
        icon: '🌅',
        description: 'Утро начинается с тебя. +10 XP за подъем до 6:00.',
        requirements: { WIL: 5 },
        benefits: { earlyRiseBonus: 10 },
        unlocked: false
      },

      unbreakable: {
        id: 'unbreakable',
        name: 'НЕСЛОМЛЕННЫЙ',
        nameEn: 'Unbreakable',
        category: 'SPIRITUAL',
        icon: '⛓️',
        description: 'Неудачи тебя не сломят. Серии не прерываются при 1 пропуске.',
        requirements: { WIL: 3 },
        benefits: { streakProtection: 1 },
        unlocked: false
      },

      discipline: {
        id: 'discipline',
        name: 'ЖЕЛЕЗНАЯ ДИСЦИПЛИНА',
        nameEn: 'Iron Discipline',
        category: 'SPIRITUAL',
        icon: '🎯',
        description: 'Дисциплина превыше всего. +30% к силе воли.',
        requirements: { WIL: 8 },
        benefits: { willBonus: 1.3 },
        unlocked: false
      },

      // ====== HYBRID PERKS ======
      warrior: {
        id: 'warrior',
        name: 'ВОИН',
        nameEn: 'Warrior',
        category: 'HYBRID',
        icon: '⚔️',
        description: 'Тело и разум в гармонии. +25% ко всем XP.',
        requirements: { STR: 7, WIL: 7 },
        benefits: { allXP: 1.25 },
        unlocked: false
      },

      scholar: {
        id: 'scholar',
        name: 'УЧЕНЫЙ',
        nameEn: 'Scholar',
        category: 'HYBRID',
        icon: '🔬',
        description: 'Знание через дисциплину. Unlock научного журнала.',
        requirements: { INT: 7, WIL: 5 },
        benefits: { scienceMode: true },
        unlocked: false
      },

      perfectionist: {
        id: 'perfectionist',
        name: 'ПЕРФЕКЦИОНИСТ',
        nameEn: 'Perfectionist',
        category: 'HYBRID',
        icon: '✨',
        description: 'Совершенство в каждой детали. +50% качество всех действий.',
        requirements: { INT: 8, PER: 8, WIL: 8 },
        benefits: { qualityBonus: 1.5 },
        unlocked: false
      },

      gladiator: {
        id: 'gladiator',
        name: 'ГЛАДИАТОР',
        nameEn: 'Gladiator',
        category: 'HYBRID',
        icon: '🏛️',
        description: 'Сила и ловкость в бою. +35% к физическим характеристикам.',
        requirements: { STR: 6, PER: 6 },
        benefits: { physicalBonus: 1.35 },
        unlocked: false
      }
    };
  }

  /**
   * Загрузка разблокированных перков из localStorage
   */
  loadUnlockedPerks() {
    const saved = localStorage.getItem('nexusUnlockedPerks');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Сохранение разблокированных перков
   */
  saveUnlockedPerks() {
    localStorage.setItem('nexusUnlockedPerks', JSON.stringify(this.unlockedPerks));
  }

  /**
   * Проверка доступности перка
   */
  canUnlock(perkId) {
    const perk = this.perks[perkId];
    if (!perk) return false;

    // Уже разблокирован?
    if (this.unlockedPerks.includes(perkId)) return false;

    // Проверяем, что statsManager существует
    if (typeof statsManager === 'undefined' || !statsManager) {
      console.warn('[PersonalCode] statsManager не определен');
      return false;
    }

    // Проверка требований статов
    const stats = statsManager.stats;
    for (const [statName, requiredLevel] of Object.entries(perk.requirements)) {
      if (!stats[statName] || stats[statName].value < requiredLevel) {
        return false;
      }
    }

    return true;
  }

  /**
   * Разблокировка перка
   */
  unlockPerk(perkId) {
    if (!this.canUnlock(perkId)) {
      return false;
    }

    this.unlockedPerks.push(perkId);
    this.perks[perkId].unlocked = true;
    this.saveUnlockedPerks();

    // Показать анимацию разблокировки
    this.showUnlockAnimation(perkId);

    // Обновить UI
    this.updateUI();

    return true;
  }

  /**
   * Показать анимацию разблокировки перка
   */
  showUnlockAnimation(perkId) {
    const perk = this.perks[perkId];

    const overlay = document.createElement('div');
    overlay.className = 'perk-unlock-overlay';
    overlay.innerHTML = `
      <div class="perk-unlock-content">
        <div class="perk-unlock-icon">${perk.icon}</div>
        <div class="perk-unlock-title">ПЕРК РАЗБЛОКИРОВАН!</div>
        <div class="perk-unlock-name">${perk.name}</div>
        <div class="perk-unlock-description">${perk.description}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 500);
    }, 3000);
  }

  /**
   * Получить модификатор бонуса
   */
  getBonus(bonusType) {
    let multiplier = 1.0;

    for (const perkId of this.unlockedPerks) {
      const perk = this.perks[perkId];
      if (perk && perk.benefits[bonusType]) {
        multiplier *= perk.benefits[bonusType];
      }
    }

    return multiplier;
  }

  /**
   * Проверить наличие особого бонуса
   */
  hasBonus(bonusType) {
    for (const perkId of this.unlockedPerks) {
      const perk = this.perks[perkId];
      if (perk && perk.benefits[bonusType]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Обновление UI дерева перков
   */
  updateUI() {
    console.log('[PersonalCode] updateUI вызван');
    console.log('[PersonalCode] stats:', typeof statsManager !== 'undefined' ? statsManager.stats : 'statsManager не определен');

    const categories = {
      PHYSICAL: [],
      MENTAL: [],
      SPIRITUAL: [],
      HYBRID: []
    };

    // Группировка перков по категориям
    for (const [perkId, perk] of Object.entries(this.perks)) {
      categories[perk.category].push({ ...perk, id: perkId });
    }

    console.log('[PersonalCode] Категории перков:', categories);

    // Обновление каждой категории
    for (const [category, perks] of Object.entries(categories)) {
      const container = document.getElementById(`perks-${category.toLowerCase()}`);

      console.log(`[PersonalCode] Ищем контейнер: perks-${category.toLowerCase()}`);
      console.log(`[PersonalCode] Контейнер для ${category}:`, container);
      console.log(`[PersonalCode] Перков в категории ${category}:`, perks.length);

      if (!container) {
        console.warn(`[PersonalCode] Контейнер не найден для категории ${category}`);
        continue;
      }

      container.innerHTML = perks.map(perk => {
        const isUnlocked = this.unlockedPerks.includes(perk.id);
        const canUnlock = this.canUnlock(perk.id);
        const reqText = Object.entries(perk.requirements)
          .map(([stat, level]) => `${stat} ${level}+`)
          .join(', ');

        return `
          <div class="perk-card ${isUnlocked ? 'unlocked' : ''} ${canUnlock ? 'available' : 'locked'}"
               data-perk="${perk.id}">
            <div class="perk-icon">${perk.icon}</div>
            <div class="perk-info">
              <div class="perk-name">${perk.name}</div>
              <div class="perk-requirements">${reqText}</div>
              <div class="perk-description">${perk.description}</div>
              ${!isUnlocked && canUnlock ? `
                <button class="perk-unlock-btn" onclick="personalCodeManager.unlockPerk('${perk.id}')">
                  РАЗБЛОКИРОВАТЬ
                </button>
              ` : ''}
              ${isUnlocked ? `<div class="perk-status">✓ АКТИВЕН</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    // Обновление счетчика перков
    this.updatePerkCounter();

    console.log('[PersonalCode] updateUI завершен');
  }

  /**
   * Обновление счетчика разблокированных перков
   */
  updatePerkCounter() {
    const totalPerks = Object.keys(this.perks).length;
    const unlockedCount = this.unlockedPerks.length;

    const counter = document.getElementById('perk-counter');
    if (counter) {
      counter.textContent = `${unlockedCount} / ${totalPerks}`;
    }

    // Обновить дашборд
    this.updateDashboard();
  }

  /**
   * Получить количество доступных перков
   */
  getAvailableCount() {
    return Object.keys(this.perks).filter(perkId => this.canUnlock(perkId)).length;
  }

  /**
   * Обновление виджета Personal Code на дашборде
   */
  updateDashboard() {
    const totalPerks = Object.keys(this.perks).length;
    const unlockedCount = this.unlockedPerks.length;
    const availableCount = this.getAvailableCount();

    // Обновить счетчик разблокированных
    const dashboardCounter = document.getElementById('dashboard-perks-count');
    if (dashboardCounter) {
      dashboardCounter.textContent = `${unlockedCount} / ${totalPerks}`;
    }

    // Обновить счетчик доступных
    const dashboardAvailable = document.getElementById('dashboard-perks-available');
    if (dashboardAvailable) {
      dashboardAvailable.textContent = availableCount;
    }

    // Показать активные перки
    const dashboardActivePerks = document.getElementById('dashboard-active-perks');
    if (dashboardActivePerks) {
      if (unlockedCount === 0) {
        dashboardActivePerks.innerHTML = `
          <p style="font-size: 11px; color: var(--nexus-green-dim); text-align: center; padding: 16px 0;">
            НЕТ АКТИВНЫХ ПЕРКОВ
          </p>
        `;
      } else {
        const activePerksHTML = this.unlockedPerks.slice(0, 4).map(perkId => {
          const perk = this.perks[perkId];
          return `
            <div style="
              background: var(--nexus-surface);
              border: 1px solid var(--nexus-amber);
              border-radius: 8px;
              padding: 8px 12px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 11px;
            ">
              <span style="font-size: 16px;">${perk.icon}</span>
              <span style="color: var(--nexus-text); font-weight: 500;">${perk.name}</span>
            </div>
          `;
        }).join('');

        const moreText = unlockedCount > 4 ? `
          <div style="font-size: 11px; color: var(--nexus-text-dim); padding: 8px;">
            +${unlockedCount - 4} еще...
          </div>
        ` : '';

        dashboardActivePerks.innerHTML = activePerksHTML + moreText;
      }
    }
  }
}

// Инициализация менеджера Personal Code будет происходить после загрузки DOM
let personalCodeManager;
