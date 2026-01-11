/**
 * NEXUS OS - RPG Stats System
 * Manages character stats (STR, PER, INT, WIL) and XP progression
 */

class StatsManager {
  constructor() {
    this.stats = this.loadStats();
    this.XP_PER_LEVEL = 100;

    // XP Rewards
    this.XP_REWARDS = {
      workout: { stat: 'STR', amount: 10 },
      meditation: { stat: 'PER', amount: 15 },
      code: { stat: 'INT', amount: 20 },
      psychTest: { stat: 'WIL', amount: 10 }
    };
  }

  /**
   * Load stats from localStorage or initialize defaults
   */
  loadStats() {
    const saved = localStorage.getItem('nexusStats');
    if (saved) {
      return JSON.parse(saved);
    }

    // Default stats
    return {
      STR: { value: 1, xp: 0 },
      PER: { value: 1, xp: 0 },
      INT: { value: 1, xp: 0 },
      WIL: { value: 1, xp: 0 }
    };
  }

  /**
   * Save stats to localStorage
   */
  saveStats() {
    localStorage.setItem('nexusStats', JSON.stringify(this.stats));
  }

  /**
   * Add XP to a stat
   */
  addXP(statName, amount) {
    if (!this.stats[statName]) {
      console.error(`Unknown stat: ${statName}`);
      return false;
    }

    const stat = this.stats[statName];
    stat.xp += amount;

    // Check for level up
    while (stat.xp >= this.XP_PER_LEVEL) {
      stat.xp -= this.XP_PER_LEVEL;
      stat.value += 1;
      this.showLevelUp(statName, stat.value);
    }

    this.saveStats();
    this.updateUI();
    return true;
  }

  /**
   * Add XP for activity type
   */
  addXPForActivity(activityType) {
    const reward = this.XP_REWARDS[activityType];
    if (!reward) {
      console.error(`Unknown activity type: ${activityType}`);
      return false;
    }

    // Применить бонусы от перков
    let xpAmount = reward.amount;

    // Специфичные бонусы для типов активности
    if (activityType === 'workout') {
      xpAmount *= personalCodeManager.getBonus('workoutXP');
    } else if (activityType === 'code') {
      xpAmount *= personalCodeManager.getBonus('codeXP');
    } else if (activityType === 'meditation') {
      xpAmount *= personalCodeManager.getBonus('meditationXP');
    }

    // Общий бонус ко всем XP
    xpAmount *= personalCodeManager.getBonus('allXP');

    // Округлить до целого
    xpAmount = Math.floor(xpAmount);

    return this.addXP(reward.stat, xpAmount);
  }

  /**
   * Update all stat displays in UI
   */
  updateUI() {
    Object.keys(this.stats).forEach(statName => {
      const stat = this.stats[statName];
      const statKey = statName.toLowerCase();

      // Update value
      const valueEl = document.getElementById(`stat-${statKey}-value`);
      if (valueEl) {
        valueEl.textContent = stat.value;
      }

      // Update XP text
      const xpEl = document.getElementById(`stat-${statKey}-xp`);
      if (xpEl) {
        xpEl.textContent = `${stat.xp} / ${this.XP_PER_LEVEL} XP`;
      }

      // Update XP bar
      const barEl = document.getElementById(`stat-${statKey}-bar`);
      if (barEl) {
        const percentage = (stat.xp / this.XP_PER_LEVEL) * 100;
        barEl.style.width = `${percentage}%`;
      }
    });
  }

  /**
   * Show level up overlay animation
   */
  showLevelUp(statName, newValue) {
    // Play sound if available
    this.playSound('level-up');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-title">LEVEL UP!</div>
        <div class="level-up-stat">${statName} INCREASED: ${newValue - 1} → ${newValue}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Remove after 3 seconds
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentElement) {
          overlay.parentElement.removeChild(overlay);
        }
      }, 300);
    }, 3000);

    // Обновить Personal Code - могли разблокироваться новые перки
    personalCodeManager.updateUI();
  }

  /**
   * Play sound effect (if sound files are available)
   */
  playSound(soundName) {
    try {
      const audio = new Audio(`assets/sounds/${soundName}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(err => {
        // Sound files not available, ignore silently
        console.log(`Sound not available: ${soundName}`);
      });
    } catch (err) {
      // Ignore audio errors
    }
  }

  /**
   * Get total level (sum of all stats)
   */
  getTotalLevel() {
    return Object.values(this.stats).reduce((sum, stat) => sum + stat.value, 0);
  }

  /**
   * Get stat value
   */
  getStatValue(statName) {
    return this.stats[statName]?.value || 1;
  }

  /**
   * Get stat XP
   */
  getStatXP(statName) {
    return this.stats[statName]?.xp || 0;
  }

  /**
   * Reset all stats (for testing or fresh start)
   */
  resetStats() {
    if (confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
      this.stats = {
        STR: { value: 1, xp: 0 },
        PER: { value: 1, xp: 0 },
        INT: { value: 1, xp: 0 },
        WIL: { value: 1, xp: 0 }
      };
      this.saveStats();
      this.updateUI();
      return true;
    }
    return false;
  }

  /**
   * Get stats summary for display
   */
  getStatsSummary() {
    return {
      STR: this.stats.STR,
      PER: this.stats.PER,
      INT: this.stats.INT,
      WIL: this.stats.WIL,
      totalLevel: this.getTotalLevel()
    };
  }
}

// Create singleton instance
const statsManager = new StatsManager();

// Initialize stats display when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    statsManager.updateUI();
  });
} else {
  statsManager.updateUI();
}
