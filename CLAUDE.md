# CLAUDE.md - Self-Tracker (NEXUS OS) Codebase Guide

## Project Overview

**NEXUS OS** is a personal life operating system / self-tracker web application with RPG gamification elements. It's designed as a single-page application (SPA) that helps users track various aspects of their life including workouts, meditation, coding sessions, goals, weight, and psychological assessments.

**Version:** 3.0.0
**Language:** Russian (primary UI language)
**Design Theme:** Pip-Boy / Fallout-inspired terminal aesthetic

### Game System v3.0

The app uses a **Mode System** for adaptive self-management:

| Mode | Symbol | When to Use |
|------|--------|-------------|
| **НОРМА** (Norm) | ▓ | Default state, full productivity |
| **МИНИМУМ** (Minimum) | ░ | Low energy, reduced expectations |
| **КРИЗИС** (Crisis) | ▒ | Emergency, survival mode |

**Sacred Cow (Священная корова):** 3-5 weekly attempts toward goals, tracked on dashboard.

## Architecture

### File Structure

```
self-tracker/
├── index.html          # Main SPA entry point with all sections
├── index-old.html      # Legacy version backup
├── version.txt         # Version history and feature changelog
├── css/
│   ├── nexus-theme.css # Main NEXUS/Pip-Boy theme styles (~45KB)
│   └── styles.css      # Additional/legacy styles
├── js/
│   ├── app.js          # Main application logic, section rendering
│   ├── storage.js      # StorageManager - localStorage abstraction
│   ├── ui.js           # UIManager - notifications, UI helpers
│   ├── stats.js        # StatsManager - RPG stats system (STR/PER/INT/WIL)
│   ├── game-state.js   # GameStateManager - mode system & sacred cow
│   ├── personal-code.js # PersonalCodeManager - perks system
│   ├── weight.js       # Weight tracking with charts
│   ├── phq15.js        # Depression screening test (PHQ-15 based)
│   └── codex.js        # Personal codex with Markdown + tab navigation
├── CODEX.md            # Personal codex template (minimal Fallout style)
└── README.md
```

### Core Modules

| Module | Class/Global | Purpose |
|--------|-------------|---------|
| `storage.js` | `StorageManager` → `storage` | Data persistence via localStorage |
| `ui.js` | `UIManager` → `ui` | Notifications, form helpers, date formatting |
| `stats.js` | `StatsManager` → `statsManager` | RPG character stats and XP progression |
| `game-state.js` | `GameStateManager` → `gameState` | Mode system, sacred cow, daily tracking |
| `personal-code.js` | `PersonalCodeManager` → `personalCodeManager` | Perk tree system |
| `app.js` | Global functions | Main app logic, CRUD operations, rendering |
| `weight.js` | Global functions | Weight tracking module |
| `phq15.js` | Global functions | Psychological test module |
| `codex.js` | Global functions | Codex with Markdown + auto-tab navigation |

### Module Initialization Order

1. `storage.js` - Creates `storage` singleton (loads data immediately)
2. `ui.js` - Creates `ui` singleton
3. `stats.js` - Creates `statsManager` singleton
4. `game-state.js` - Creates `gameState` singleton (loads mode state)
5. `personal-code.js` - Defines `PersonalCodeManager` class
6. `app.js` - On DOMContentLoaded:
   - Creates `personalCodeManager` instance
   - Calls `initializeDates()`
   - Calls `renderAll()`
   - Calls `initModeSystem()` - mode widget, indicators
   - Updates perk UI

## Data Storage

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `workouts` | Array | Workout journal entries |
| `meditations` | Array | Meditation sessions |
| `code` | Array | Coding sessions |
| `goals` | Array | Goals with progress tracking |
| `achievements` | Array | User achievements |
| `program` | Array | Workout program by day |
| `testResults` | Array | Depression test results |
| `nexusStats` | Object | RPG stats (STR, PER, INT, WIL) |
| `nexusUnlockedPerks` | Array | IDs of unlocked perks |
| `nexusWeightHistory` | Array | Weight measurements |
| `nexusWeightGoal` | Number | Target weight |
| `nexusPHQ15History` | Array | PHQ-15 test history |
| `nexusPersonalCodeText` | String | Personal codex markdown text |
| `nexusTheme` | String | Theme preference ('dark'/'light') |
| `codexReadingMode` | String | Reading mode state |
| `nexusGameState` | Object | Mode system state (mode, history, sacredCow) |

### Data Object Schemas

```javascript
// Workout entry
{
  id: Number,           // Unique ID (Date.now() + Math.random())
  date: "YYYY-MM-DD",
  exercise: String,
  sets: Number,
  reps: Number,
  weight: Number        // kg
}

// Meditation entry
{
  id: Number,
  date: "YYYY-MM-DD",
  minutes: Number,
  type: String,
  notes: String
}

// Goal entry
{
  id: Number,
  name: String,
  goal: String,         // Legacy field (same as name)
  deadline: "YYYY-MM-DD",
  type: "Краткосрочная" | "Долгосрочная",
  completed: Boolean,
  progress: Number      // 0-100
}

// Program exercise
{
  id: Number,
  day: "Вторник" | "Четверг" | "Суббота",
  exercise: String,
  sets: Number,
  reps: Number,
  weight: Number,
  video: String         // Optional YouTube URL
}

// Stats structure
{
  STR: { value: Number, xp: Number },
  PER: { value: Number, xp: Number },
  INT: { value: Number, xp: Number },
  WIL: { value: Number, xp: Number }
}

// Game state structure
{
  currentMode: "norm" | "minimum" | "crisis",
  modeHistory: [{
    mode: String,
    date: "YYYY-MM-DD",
    timestamp: ISO String
  }],
  sacredCow: {
    "YYYY-MM-DD": [{           // Week start (Monday)
      date: "YYYY-MM-DD",
      timestamp: ISO String,
      note: String
    }]
  }
}
```

## RPG Stats System

The app uses 4 primary stats (Fallout-inspired):

| Stat | Full Name | Русский | Gains XP From |
|------|-----------|---------|---------------|
| STR | Strength | Сила | Workouts (+10 XP) |
| PER | Perception | Восприятие | Meditation (+15 XP) |
| INT | Intelligence | Интеллект | Coding (+20 XP per hour) |
| WIL | Willpower | Воля | Psych tests (+10 XP) |

- **XP per Level:** 100
- **Level up:** Triggers overlay animation
- **Perks:** Unlock when stat requirements are met

## Perks System

16 perks across 4 categories:

| Category | Russian | Stats Required |
|----------|---------|----------------|
| PHYSICAL | Физические | STR, PER |
| MENTAL | Ментальные | INT |
| SPIRITUAL | Духовные | WIL |
| HYBRID | Гибридные | Multiple stats |

Perks provide bonuses like XP multipliers, unlock features, etc.

## Mode System (Game v3.0)

The mode system provides adaptive self-management with three states:

### Mode Configurations

| Mode | Key | Color | Description |
|------|-----|-------|-------------|
| НОРМА | `norm` | Green | Full productivity, all tasks |
| МИНИМУМ | `minimum` | Amber | Reduced load, basic maintenance |
| КРИЗИС | `crisis` | Red | Survival mode, minimal expectations |

### Key Functions (game-state.js)

```javascript
gameState.getMode()              // Current mode: 'norm'|'minimum'|'crisis'
gameState.setMode(mode, reason)  // Change mode with optional reason
gameState.getModeConfig(mode)    // Get mode configuration (color, tasks, etc.)
gameState.getModeStats(days)     // Stats for last N days by mode

// Sacred Cow
gameState.getSacredCowStatus()   // {count, target, status, message, progress}
gameState.addSacredCowAttempt()  // Add weekly attempt (max 7)
gameState.getSacredCowCount()    // Current week's attempt count
```

### Mode Widget (Dashboard)

The dashboard displays an adaptive mode widget:
- **NORM mode:** Full widget with daily tasks + Sacred Cow progress + 30-day stats
- **MINIMUM/CRISIS:** Minimal widget with simplified tasks and support message

## Codex Tab Navigation

The codex module auto-generates navigation tabs from `#` (h1) headers in markdown:

```javascript
// codex.js
parseCodexSections(text)     // Parse markdown into sections by # headers
renderCodexTabs()            // Generate tab buttons (shown if 2+ sections)
navigateToCodexSection(idx)  // Scroll to section and highlight
```

Tabs appear only in Preview mode when there are 2+ sections.

## UI Sections

The app has 10 main sections (single-page navigation):

1. **dashboard** - Overview with bento grid widgets
2. **workout-program** - Weekly workout schedule (Tue/Thu/Sat)
3. **workouts** - Workout journal with Chart.js graphs
4. **meditation** - Meditation sessions log
5. **coding** - Coding sessions tracker
6. **goals** - Goals with progress bars
7. **weight** - Weight tracking with SVG chart
8. **psych-test** - PHQ-15 depression screening
9. **codex** - Personal principles (Markdown support)
10. **perks** - Perk tree visualization

## Development Conventions

### Code Style

- **Language:** JavaScript ES6+ (no TypeScript, no build step)
- **Modules:** Class-based singletons for managers
- **Comments:** Russian for user-facing, English for technical
- **Functions:** Use `renderX()` pattern for updating UI sections
- **Event Handlers:** Inline `onclick` in HTML for navigation

### Naming Conventions

```javascript
// Functions
addWorkout()        // CRUD operations
deleteWorkout(id)
editWorkout(id)
renderWorkouts()    // UI rendering
updateDashboard()   // Dashboard widget updates

// DOM IDs
'workoutList'       // Lists: entityList
'wDate'             // Form inputs: prefix + fieldName
'stat-str-value'    // Stats: stat-{name}-{property}
```

### Console Logging

The app uses `console.log` with prefixes for debugging:
```javascript
console.log('[App] renderAll вызван');
console.log('[Storage] Загружено X записей для ключа "Y"');
console.log('[PersonalCode] updateUI вызван');
console.log('[Weight] Форма - bodyFat значение:', value);
```

### Validation Pattern

```javascript
// In StorageManager
validateWorkout(data) {
  if (!data.date) return 'Укажите дату';
  if (!data.exercise) return 'Укажите упражнение';
  return null;  // null = valid
}

// Usage
if (storage.add('workouts', data, storage.validateWorkout.bind(storage))) {
  // Success
}
```

### XSS Protection

All user input is sanitized through `storage.sanitize()`:
```javascript
sanitize(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

## External Dependencies

Loaded via CDN in index.html:

| Library | Purpose |
|---------|---------|
| Chart.js | Workout progress charts |
| chartjs-adapter-date-fns | Date handling for Chart.js time scale |
| marked.js | Markdown rendering for codex |

## Common Development Tasks

### Adding a New Section

1. Add HTML section in `index.html` with `id` and `class="section"`
2. Add navigation button in `<nav>` with `onclick="showSection('id', event)"`
3. Add render function in `app.js`: `renderNewSection()`
4. Call render function in `renderAll()`
5. Add data key to `storage.js` if needed

### Adding XP for New Activity

1. Add reward in `stats.js`:
```javascript
this.XP_REWARDS = {
  newActivity: { stat: 'STAT_NAME', amount: X }
};
```

2. Call in activity handler:
```javascript
statsManager.addXPForActivity('newActivity');
```

### Adding a New Perk

1. Add perk definition in `personal-code.js` `initPerks()`:
```javascript
newPerk: {
  id: 'newPerk',
  name: 'НАЗВАНИЕ',
  category: 'PHYSICAL|MENTAL|SPIRITUAL|HYBRID',
  icon: '🆕',
  description: 'Описание перка',
  requirements: { STR: 5, INT: 3 },
  benefits: { bonusType: 1.5 },
  unlocked: false
}
```

2. Add container in HTML if new category

### Theme Support

CSS uses CSS variables for theming:
```css
:root[data-theme="dark"] {
  --nexus-green: #00ff41;
  --nexus-black: #0a0a0a;
  /* ... */
}

:root[data-theme="light"] {
  --nexus-green: #006b1a;
  --nexus-black: #f5f5f0;
  /* ... */
}
```

## Testing

No automated tests. Manual testing workflow:
1. Test on desktop browsers (Chrome, Firefox)
2. Test responsive design on mobile viewport
3. Verify localStorage persistence
4. Test import/export functionality

## Deployment

Static site hosted on GitHub Pages:
- Branch: `main` (or configured GitHub Pages branch)
- No build step required
- `.nojekyll` file prevents Jekyll processing

## Important Notes for AI Assistants

1. **Russian UI:** All user-facing text should be in Russian
2. **No Build System:** Pure vanilla JS, edit files directly
3. **localStorage First:** All data persists in browser localStorage
4. **Single HTML File:** All sections are in one index.html
5. **Chart.js Date Format:** Use `dd.MM` (lowercase) for date-fns v2+ compatibility
6. **Day Names:** Normalize day names (e.g., "вторник" → "Вторник")
7. **Avoid Breaking Changes:** Many users may have existing localStorage data
8. **Memory Leaks:** Destroy Chart.js instances before recreating
9. **Dark Theme Default:** App defaults to dark (Pip-Boy) theme
10. **Mode System:** Use mode symbols (▓ ░ ▒) consistently for Norm/Minimum/Crisis
11. **Codex Styling:** CODEX.md uses minimal Fallout style - no heavy ASCII art
