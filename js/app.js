/**
 * Self-Tracker Main App
 */

// Подключение методов уведомлений к storage
storage.showError = (msg) => ui.showError(msg);
storage.showSuccess = (msg) => ui.showSuccess(msg);

// Хранилище для Chart.js инстанса (исправление утечки памяти)
let workoutChart = null;

/* =========================
   NAVIGATION
========================= */
function showSection(sectionId, event) {
  ui.showSection(sectionId, event);
}

/* =========================
   WORKOUTS
========================= */
function addWorkout() {
  const data = {
    date: document.getElementById('wDate').value,
    exercise: document.getElementById('wExercise').value.trim(),
    sets: parseInt(document.getElementById('wSets').value) || 0,
    reps: parseInt(document.getElementById('wReps').value) || 0,
    weight: parseFloat(document.getElementById('wWeight').value) || 0,
    video: document.getElementById('wVideo').value.trim()
  };

  if (storage.add('workouts', data, storage.validateWorkout.bind(storage))) {
    ui.clearForm('workoutForm');
    ui.setTodayDate('wDate');
    renderWorkouts();
  }
}

function deleteWorkout(id) {
  if (storage.delete('workouts', id)) {
    renderWorkouts();
  }
}

function editWorkout(id) {
  const workout = storage.data.workouts.find(w => w.id === id);
  if (!workout) return;

  document.getElementById('wDate').value = workout.date;
  document.getElementById('wExercise').value = workout.exercise;
  document.getElementById('wSets').value = workout.sets;
  document.getElementById('wReps').value = workout.reps;
  document.getElementById('wWeight').value = workout.weight;
  document.getElementById('wVideo').value = workout.video || '';

  // Удаляем старую запись
  storage.delete('workouts', id);
  renderWorkouts();

  // Прокрутка к форме
  document.getElementById('workoutForm').scrollIntoView({ behavior: 'smooth' });
}

function renderWorkouts() {
  const list = document.getElementById('workoutList');
  list.innerHTML = '';

  if (storage.data.workouts.length === 0) {
    list.innerHTML = '<li class="list-item">Нет записей</li>';
    return;
  }

  // Сортировка по дате (новые первые)
  const sorted = [...storage.data.workouts].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  sorted.forEach(w => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const content = document.createElement('div');
    content.className = 'list-item-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'list-item-date';
    dateSpan.textContent = ui.formatDate(w.date);

    const text = document.createElement('div');
    text.textContent = `${w.exercise} — ${w.sets}x${w.reps} @ ${w.weight}кг`;

    content.appendChild(dateSpan);
    content.appendChild(text);

    if (w.video) {
      const videoLink = ui.createYoutubePreview(w.video);
      if (videoLink) content.appendChild(videoLink);
    }

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    actions.appendChild(ui.createEditButton(w.id, editWorkout));
    actions.appendChild(ui.createDeleteButton(w.id, deleteWorkout));

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });

  drawWorkoutChart();
}

function drawWorkoutChart() {
  const canvas = document.getElementById('workoutChart');
  if (!canvas) return;

  // Уничтожаем старый график (исправление утечки памяти)
  if (workoutChart) {
    workoutChart.destroy();
    workoutChart = null;
  }

  if (storage.data.workouts.length === 0) {
    return;
  }

  // Группировка по упражнениям
  const exercises = {};
  storage.data.workouts.forEach(w => {
    if (!exercises[w.exercise]) {
      exercises[w.exercise] = [];
    }
    exercises[w.exercise].push({ date: w.date, weight: w.weight });
  });

  // Берем топ-3 упражнения
  const datasets = Object.entries(exercises)
    .slice(0, 3)
    .map(([name, data], index) => {
      const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      const colors = ['#5b8def', '#4caf50', '#ff9800'];
      return {
        label: name,
        data: sorted.map(d => ({ x: d.date, y: d.weight })),
        borderColor: colors[index],
        backgroundColor: colors[index] + '33',
        tension: 0.4
      };
    });

  workoutChart = new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'DD.MM'
            }
          },
          title: {
            display: true,
            text: 'Дата'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Вес (кг)'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

/* =========================
   MEDITATION
========================= */
function addMeditation() {
  const data = {
    date: document.getElementById('mDate').value,
    minutes: parseInt(document.getElementById('mMinutes').value) || 0,
    type: document.getElementById('mType').value.trim(),
    notes: document.getElementById('mNotes').value.trim()
  };

  if (storage.add('meditations', data, storage.validateMeditation.bind(storage))) {
    ui.clearForm('meditationForm');
    ui.setTodayDate('mDate');
    renderMeditation();
  }
}

function deleteMeditation(id) {
  if (storage.delete('meditations', id)) {
    renderMeditation();
  }
}

function editMeditation(id) {
  const med = storage.data.meditations.find(m => m.id === id);
  if (!med) return;

  document.getElementById('mDate').value = med.date;
  document.getElementById('mMinutes').value = med.minutes;
  document.getElementById('mType').value = med.type || '';
  document.getElementById('mNotes').value = med.notes || '';

  storage.delete('meditations', id);
  renderMeditation();

  document.getElementById('meditationForm').scrollIntoView({ behavior: 'smooth' });
}

function renderMeditation() {
  const list = document.getElementById('meditationList');
  const statsDiv = document.getElementById('meditationStats');

  list.innerHTML = '';

  if (storage.data.meditations.length === 0) {
    list.innerHTML = '<li class="list-item">Нет записей</li>';
    statsDiv.innerHTML = '<div class="stat-card"><span class="stat-value">0</span><span class="stat-label">Минут всего</span></div>';
    return;
  }

  // Статистика
  let totalMinutes = 0;
  let totalSessions = storage.data.meditations.length;

  const sorted = [...storage.data.meditations].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  sorted.forEach(m => {
    totalMinutes += m.minutes;

    const li = document.createElement('li');
    li.className = 'list-item';

    const content = document.createElement('div');
    content.className = 'list-item-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'list-item-date';
    dateSpan.textContent = ui.formatDate(m.date);

    const text = document.createElement('div');
    text.textContent = `${m.minutes} минут`;
    if (m.type) text.textContent += ` — ${m.type}`;
    if (m.notes) {
      const notes = document.createElement('div');
      notes.style.fontSize = '12px';
      notes.style.color = 'var(--muted)';
      notes.textContent = m.notes;
      content.appendChild(notes);
    }

    content.appendChild(dateSpan);
    content.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    actions.appendChild(ui.createEditButton(m.id, editMeditation));
    actions.appendChild(ui.createDeleteButton(m.id, deleteMeditation));

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });

  // Обновление статистики
  const avgMinutes = Math.round(totalMinutes / totalSessions);
  statsDiv.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">${totalMinutes}</span>
        <span class="stat-label">Минут всего</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalSessions}</span>
        <span class="stat-label">Сессий</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${avgMinutes}</span>
        <span class="stat-label">Среднее</span>
      </div>
    </div>
  `;
}

/* =========================
   CODEX
========================= */
function addCode() {
  const data = {
    text: document.getElementById('codeText').value.trim(),
    cat: document.getElementById('codeCategory').value
  };

  if (storage.add('code', data, storage.validateCode.bind(storage))) {
    ui.clearForm('codeForm');
    renderCode();
  }
}

function deleteCode(id) {
  if (storage.delete('code', id)) {
    renderCode();
  }
}

function renderCode() {
  const list = document.getElementById('codeList');
  list.innerHTML = '';

  if (storage.data.code.length === 0) {
    list.innerHTML = '<li class="list-item">Нет принципов</li>';
    return;
  }

  // Группировка по категориям
  const categories = {};
  storage.data.code.forEach(c => {
    if (!categories[c.cat]) {
      categories[c.cat] = [];
    }
    categories[c.cat].push(c);
  });

  Object.entries(categories).forEach(([cat, items]) => {
    const heading = document.createElement('h3');
    heading.textContent = cat;
    heading.style.marginTop = '20px';
    list.appendChild(heading);

    items.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-item';

      const content = document.createElement('div');
      content.className = 'list-item-content';
      content.textContent = c.text;

      const actions = document.createElement('div');
      actions.className = 'list-item-actions';
      actions.appendChild(ui.createDeleteButton(c.id, deleteCode));

      li.appendChild(content);
      li.appendChild(actions);
      list.appendChild(li);
    });
  });
}

/* =========================
   GOALS
========================= */
function addGoal() {
  const data = {
    name: document.getElementById('gName').value.trim(),
    type: document.getElementById('gType').value,
    deadline: document.getElementById('gDeadline').value,
    progress: parseInt(document.getElementById('gProgress').value) || 0
  };

  if (storage.add('goals', data, storage.validateGoal.bind(storage))) {
    ui.clearForm('goalForm');
    renderGoals();
  }
}

function deleteGoal(id) {
  if (storage.delete('goals', id)) {
    renderGoals();
  }
}

function updateGoalProgress(id, newProgress) {
  const goal = storage.data.goals.find(g => g.id === id);
  if (!goal) return;

  const progress = parseInt(newProgress);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    ui.showError('Прогресс должен быть от 0 до 100');
    return;
  }

  if (storage.update('goals', id, { ...goal, progress }, storage.validateGoal.bind(storage))) {
    renderGoals();
  }
}

function renderGoals() {
  const list = document.getElementById('goalList');
  list.innerHTML = '';

  if (storage.data.goals.length === 0) {
    list.innerHTML = '<li class="list-item">Нет целей</li>';
    return;
  }

  // Группировка по типу
  const shortTerm = storage.data.goals.filter(g => g.type === 'Краткосрочная');
  const longTerm = storage.data.goals.filter(g => g.type === 'Долгосрочная');

  const renderGoalGroup = (title, goals) => {
    if (goals.length === 0) return;

    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.style.marginTop = '20px';
    list.appendChild(heading);

    goals.forEach(g => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.style.flexDirection = 'column';
      li.style.alignItems = 'flex-start';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.width = '100%';
      header.style.marginBottom = '8px';

      const nameDiv = document.createElement('div');
      nameDiv.style.flex = '1';

      const name = document.createElement('strong');
      name.textContent = g.name;
      nameDiv.appendChild(name);

      if (g.deadline) {
        const deadline = document.createElement('span');
        deadline.className = 'list-item-date';
        deadline.textContent = ` (до ${ui.formatDate(g.deadline)})`;
        nameDiv.appendChild(deadline);
      }

      const actions = document.createElement('div');
      actions.className = 'list-item-actions';
      actions.appendChild(ui.createDeleteButton(g.id, deleteGoal));

      header.appendChild(nameDiv);
      header.appendChild(actions);

      const progressContainer = document.createElement('div');
      progressContainer.style.width = '100%';
      progressContainer.style.display = 'flex';
      progressContainer.style.alignItems = 'center';
      progressContainer.style.gap = '12px';

      const progressBar = ui.createProgressBar(g.progress);
      progressBar.style.flex = '1';

      const progressInput = document.createElement('input');
      progressInput.type = 'number';
      progressInput.min = '0';
      progressInput.max = '100';
      progressInput.value = g.progress;
      progressInput.style.width = '70px';
      progressInput.style.margin = '0';
      progressInput.setAttribute('aria-label', 'Прогресс в процентах');
      progressInput.onchange = () => updateGoalProgress(g.id, progressInput.value);

      const progressLabel = document.createElement('span');
      progressLabel.textContent = '%';
      progressLabel.style.fontSize = '14px';

      progressContainer.appendChild(progressBar);
      progressContainer.appendChild(progressInput);
      progressContainer.appendChild(progressLabel);

      li.appendChild(header);
      li.appendChild(progressContainer);
      list.appendChild(li);
    });
  };

  renderGoalGroup('Краткосрочные цели', shortTerm);
  renderGoalGroup('Долгосрочные цели', longTerm);
}

/* =========================
   MOTIVATION
========================= */
const motivationQuotes = [
  "Дисциплина сильнее мотивации",
  "Маленькие шаги каждый день",
  "Ты уже делаешь больше, чем вчера",
  "Успех — это сумма маленьких усилий, повторяемых изо дня в день",
  "Не ждите, начните. Не бойтесь, действуйте",
  "Твоё будущее создаётся тем, что ты делаешь сегодня",
  "Неважно, как медленно ты идёшь, главное — не останавливайся",
  "Каждый эксперт когда-то был новичком"
];

function showRandomQuote() {
  const quoteDiv = document.getElementById('randomQuote');
  if (quoteDiv) {
    const quote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
    quoteDiv.className = 'card quote-card';
    quoteDiv.textContent = quote;
  }
}

function addAchievement() {
  const data = {
    text: document.getElementById('aText').value.trim(),
    date: new Date().toISOString().split('T')[0]
  };

  if (storage.add('achievements', data, storage.validateAchievement.bind(storage))) {
    ui.clearForm('achievementForm');
    renderAchievements();
  }
}

function deleteAchievement(id) {
  if (storage.delete('achievements', id)) {
    renderAchievements();
  }
}

function renderAchievements() {
  const list = document.getElementById('achievementList');
  list.innerHTML = '';

  if (storage.data.achievements.length === 0) {
    list.innerHTML = '<li class="list-item">Нет достижений. Добавьте первое!</li>';
    return;
  }

  const sorted = [...storage.data.achievements].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  sorted.forEach(a => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const content = document.createElement('div');
    content.className = 'list-item-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'list-item-date';
    dateSpan.textContent = ui.formatDate(a.date);

    const text = document.createElement('div');
    text.textContent = a.text;

    content.appendChild(dateSpan);
    content.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    actions.appendChild(ui.createDeleteButton(a.id, deleteAchievement));

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

/* =========================
   WORKOUT PROGRAM
========================= */
function addProgramExercise() {
  const data = {
    day: document.getElementById('pDay').value,
    exercise: document.getElementById('pExercise').value.trim(),
    sets: parseInt(document.getElementById('pSets').value),
    reps: parseInt(document.getElementById('pReps').value),
    weight: parseFloat(document.getElementById('pWeight').value),
    video: document.getElementById('pVideo').value.trim()
  };

  if (storage.add('program', data, storage.validateProgram.bind(storage))) {
    ui.clearForm('programForm');
    renderProgram();
  }
}

function deleteProgramExercise(id) {
  if (storage.delete('program', id)) {
    renderProgram();
  }
}

function editProgramExercise(id) {
  const exercise = storage.data.program.find(p => p.id === id);
  if (!exercise) return;

  document.getElementById('pDay').value = exercise.day;
  document.getElementById('pExercise').value = exercise.exercise;
  document.getElementById('pSets').value = exercise.sets;
  document.getElementById('pReps').value = exercise.reps;
  document.getElementById('pWeight').value = exercise.weight;
  document.getElementById('pVideo').value = exercise.video || '';

  storage.delete('program', id);
  renderProgram();

  document.getElementById('programForm').scrollIntoView({ behavior: 'smooth' });
}

function renderProgram() {
  const days = {
    'Вторник': document.getElementById('programTuesday'),
    'Четверг': document.getElementById('programThursday'),
    'Суббота': document.getElementById('programSaturday')
  };

  // Очистить все списки
  Object.values(days).forEach(list => {
    if (list) list.innerHTML = '';
  });

  if (storage.data.program.length === 0) {
    Object.values(days).forEach(list => {
      if (list) list.innerHTML = '<li class="list-item">Нет упражнений</li>';
    });
    return;
  }

  // Группировка по дням
  const programByDay = {
    'Вторник': [],
    'Четверг': [],
    'Суббота': []
  };

  storage.data.program.forEach(p => {
    if (programByDay[p.day]) {
      programByDay[p.day].push(p);
    }
  });

  // Отрисовка каждого дня
  Object.entries(programByDay).forEach(([day, exercises]) => {
    const list = days[day];
    if (!list) return;

    if (exercises.length === 0) {
      list.innerHTML = '<li class="list-item">Нет упражнений</li>';
      return;
    }

    exercises.forEach((p, index) => {
      const li = document.createElement('li');
      li.className = 'list-item';

      const content = document.createElement('div');
      content.className = 'list-item-content';

      const orderSpan = document.createElement('span');
      orderSpan.style.fontWeight = 'bold';
      orderSpan.style.marginRight = '8px';
      orderSpan.textContent = `${index + 1}.`;

      const text = document.createElement('div');
      text.innerHTML = `<strong>${p.exercise}</strong><br>${p.sets}x${p.reps} @ ${p.weight}кг`;

      content.appendChild(orderSpan);
      content.appendChild(text);

      if (p.video) {
        const videoLink = ui.createYoutubePreview(p.video);
        if (videoLink) content.appendChild(videoLink);
      }

      const actions = document.createElement('div');
      actions.className = 'list-item-actions';
      actions.appendChild(ui.createEditButton(p.id, editProgramExercise));
      actions.appendChild(ui.createDeleteButton(p.id, deleteProgramExercise));

      li.appendChild(content);
      li.appendChild(actions);
      list.appendChild(li);
    });
  });
}

/* =========================
   PSYCHOLOGICAL TEST
========================= */
function calculateTestResult() {
  const form = document.getElementById('depressionTestForm');
  let totalScore = 0;

  // Подсчитать баллы
  for (let i = 1; i <= 15; i++) {
    const answer = form.querySelector(`input[name="q${i}"]:checked`);
    if (!answer) {
      ui.showError(`Пожалуйста, ответьте на вопрос ${i}`);
      return;
    }
    totalScore += parseInt(answer.value);
  }

  // Интерпретация результата
  let interpretation = '';
  let severity = '';

  if (totalScore <= 4) {
    severity = 'Минимальная';
    interpretation = 'Симптомы депрессии минимальны или отсутствуют. Вы в хорошем психологическом состоянии.';
  } else if (totalScore <= 9) {
    severity = 'Легкая';
    interpretation = 'Легкие симптомы депрессии. Рекомендуется обратить внимание на свое состояние и попробовать методы самопомощи.';
  } else if (totalScore <= 14) {
    severity = 'Умеренная';
    interpretation = 'Умеренные симптомы депрессии. Рекомендуется обратиться к специалисту для консультации.';
  } else if (totalScore <= 19) {
    severity = 'Средне-тяжелая';
    interpretation = 'Средне-тяжелые симптомы депрессии. Настоятельно рекомендуется обратиться к психологу или психотерапевту.';
  } else {
    severity = 'Тяжелая';
    interpretation = 'Тяжелые симптомы депрессии. Необходимо немедленно обратиться к специалисту.';
  }

  // Показать результат
  const resultDiv = document.getElementById('testResult');
  const scoreDiv = document.getElementById('testScore');

  scoreDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 48px; font-weight: bold; color: var(--accent); margin-bottom: 8px;">
        ${totalScore}
      </div>
      <div style="font-size: 20px; margin-bottom: 16px;">
        ${severity} депрессия
      </div>
      <div style="font-size: 14px; color: var(--text); line-height: 1.6;">
        ${interpretation}
      </div>
    </div>
  `;

  resultDiv.style.display = 'block';
  resultDiv.scrollIntoView({ behavior: 'smooth' });

  // Сохранить результат
  const testData = {
    date: new Date().toISOString().split('T')[0],
    score: totalScore,
    severity: severity
  };

  if (storage.add('testResults', testData, storage.validateTestResult.bind(storage))) {
    renderTestHistory();
    ui.showSuccess('Результат теста сохранен');
  }

  // Очистить форму
  form.reset();
}

function deleteTestResult(id) {
  if (storage.delete('testResults', id)) {
    renderTestHistory();
  }
}

function renderTestHistory() {
  const list = document.getElementById('testHistory');
  list.innerHTML = '';

  if (storage.data.testResults.length === 0) {
    list.innerHTML = '<li class="list-item">Нет результатов</li>';
    return;
  }

  const sorted = [...storage.data.testResults].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const content = document.createElement('div');
    content.className = 'list-item-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'list-item-date';
    dateSpan.textContent = ui.formatDate(t.date);

    const text = document.createElement('div');
    text.innerHTML = `<strong>Баллы:</strong> ${t.score} — <span style="color: var(--muted);">${t.severity}</span>`;

    content.appendChild(dateSpan);
    content.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    actions.appendChild(ui.createDeleteButton(t.id, deleteTestResult));

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

/* =========================
   IMPORT / EXPORT
========================= */
function exportData() {
  storage.exportData();
}

function importData() {
  storage.importData(() => {
    // После успешного импорта перерисовать все секции
    renderAll();
  });
}

/* =========================
   INITIALIZATION
========================= */
function renderAll() {
  renderWorkouts();
  renderMeditation();
  renderCode();
  renderGoals();
  renderAchievements();
  renderProgram();
  renderTestHistory();
  showRandomQuote();
}

function initializeDates() {
  ui.setTodayDate('wDate');
  ui.setTodayDate('mDate');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  initializeDates();
  renderAll();

  // Обновлять цитату при каждом открытии раздела мотивации
  const motivationNav = document.querySelector('[data-section="motivation"]');
  if (motivationNav) {
    motivationNav.addEventListener('click', showRandomQuote);
  }
});

// Автосохранение при закрытии страницы
window.addEventListener('beforeunload', () => {
  storage.save();
});
