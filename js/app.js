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
    weight: parseFloat(document.getElementById('wWeight').value) || 0
  };

  if (storage.add('workouts', data, storage.validateWorkout.bind(storage))) {
    // Add XP for STR
    if (typeof statsManager !== 'undefined') {
      statsManager.addXPForActivity('workout');
    }
    ui.clearForm('workoutForm');
    ui.setTodayDate('wDate');
    renderWorkouts();
    updateDashboard();
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
    minutes: parseInt(document.getElementById('mDuration').value) || 0,
    type: 'Meditation',
    notes: document.getElementById('mNote').value.trim()
  };

  if (storage.add('meditations', data, storage.validateMeditation.bind(storage))) {
    // Add XP for PER
    if (typeof statsManager !== 'undefined') {
      statsManager.addXPForActivity('meditation');
    }
    ui.clearForm('meditationForm');
    ui.setTodayDate('mDate');
    renderMeditation();
    updateDashboard();
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
    goal: document.getElementById('gGoal').value.trim(),
    deadline: document.getElementById('gDeadline').value,
    completed: false
  };

  if (!data.goal || !data.deadline) {
    ui.showError('Заполните все обязательные поля');
    return;
  }

  if (storage.add('goals', data)) {
    ui.clearForm('goalForm');
    renderGoals();
    updateDashboard();
  }
}

function deleteGoal(id) {
  if (storage.delete('goals', id)) {
    renderGoals();
    updateDashboard();
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
    updateDashboard();
  }
}

function deleteProgramExercise(id) {
  if (storage.delete('program', id)) {
    renderProgram();
    updateDashboard();
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

function completeExercise(id) {
  const exercise = storage.data.program.find(p => p.id === id);
  if (!exercise) return;

  // Создать запись в тренировках с сегодняшней датой
  const workoutData = {
    date: new Date().toISOString().split('T')[0],
    exercise: exercise.exercise,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight
  };

  if (storage.add('workouts', workoutData, storage.validateWorkout.bind(storage))) {
    // Add XP for STR
    if (typeof statsManager !== 'undefined') {
      statsManager.addXPForActivity('workout');
    }
    ui.showSuccess(`✓ Выполнено: ${exercise.exercise}`);
    renderWorkouts();
    updateDashboard();

    // Если мы на странице тренировок, прокрутим к списку
    const workoutsSection = document.getElementById('workouts');
    if (workoutsSection.style.display !== 'none') {
      document.getElementById('workoutList').scrollIntoView({ behavior: 'smooth' });
    }
  }
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

      // Добавление YouTube ссылки
      if (p.video) {
        const videoLink = ui.createYoutubePreview(p.video);
        if (videoLink) {
          text.appendChild(document.createTextNode(' '));
          text.appendChild(videoLink);
        }
      }

      const actions = document.createElement('div');
      actions.className = 'list-item-actions';

      // Кнопка "Выполнить"
      const completeBtn = document.createElement('button');
      completeBtn.className = 'btn-complete';
      completeBtn.textContent = '✓';
      completeBtn.setAttribute('aria-label', 'Отметить как выполненное');
      completeBtn.title = 'Выполнить упражнение';
      completeBtn.onclick = (e) => {
        e.stopPropagation();
        completeExercise(p.id);
      };

      actions.appendChild(completeBtn);
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
   VISION BOARD
========================= */
function addVision() {
  const data = {
    category: document.getElementById('vCategory').value,
    title: document.getElementById('vTitle').value.trim(),
    description: document.getElementById('vDescription').value.trim(),
    deadline: document.getElementById('vDeadline').value,
    achieved: false,
    createdDate: new Date().toISOString().split('T')[0]
  };

  if (storage.add('visions', data, storage.validateVision.bind(storage))) {
    ui.clearForm('visionForm');
    renderVisionBoard();
  }
}

function deleteVision(id) {
  if (storage.delete('visions', id)) {
    renderVisionBoard();
  }
}

function toggleVisionAchieved(id) {
  const vision = storage.data.visions.find(v => v.id === id);
  if (!vision) return;

  vision.achieved = !vision.achieved;
  if (vision.achieved) {
    vision.achievedDate = new Date().toISOString().split('T')[0];
  } else {
    delete vision.achievedDate;
  }

  storage.save();
  ui.showSuccess(vision.achieved ? '🎉 Поздравляем с достижением!' : 'Отмечено как активное');
  renderVisionBoard();
}

function renderVisionBoard() {
  const board = document.getElementById('visionBoard');
  board.innerHTML = '';

  if (storage.data.visions.length === 0) {
    board.innerHTML = '<div class="card" style="text-align: center; padding: 40px;"><p style="color: var(--muted);">Начните добавлять свои мечты и желания на карту ✨</p></div>';
    return;
  }

  // Группировка по категориям
  const categories = {};
  storage.data.visions.forEach(v => {
    if (!categories[v.category]) {
      categories[v.category] = [];
    }
    categories[v.category].push(v);
  });

  // Отрисовка по категориям
  Object.entries(categories).forEach(([category, visions]) => {
    const categorySection = document.createElement('div');
    categorySection.className = 'vision-category';

    const heading = document.createElement('h3');
    heading.textContent = category;
    heading.style.marginBottom = '16px';
    categorySection.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'vision-cards-grid';

    visions.forEach(v => {
      const card = document.createElement('div');
      card.className = v.achieved ? 'vision-card vision-card-achieved' : 'vision-card';

      const cardContent = document.createElement('div');
      cardContent.className = 'vision-card-content';

      const title = document.createElement('h4');
      title.textContent = v.title;
      title.style.marginTop = '0';
      cardContent.appendChild(title);

      if (v.description) {
        const desc = document.createElement('p');
        desc.textContent = v.description;
        desc.style.fontSize = '14px';
        desc.style.color = 'var(--muted)';
        cardContent.appendChild(desc);
      }

      if (v.deadline) {
        const deadline = document.createElement('div');
        deadline.className = 'vision-deadline';
        deadline.innerHTML = `📅 До ${ui.formatDate(v.deadline)}`;
        cardContent.appendChild(deadline);
      }

      if (v.achieved && v.achievedDate) {
        const achieved = document.createElement('div');
        achieved.className = 'vision-achieved-badge';
        achieved.textContent = `✓ Достигнуто ${ui.formatDate(v.achievedDate)}`;
        cardContent.appendChild(achieved);
      }

      card.appendChild(cardContent);

      const actions = document.createElement('div');
      actions.className = 'vision-card-actions';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = v.achieved ? 'btn-vision-toggle achieved' : 'btn-vision-toggle';
      toggleBtn.textContent = v.achieved ? '↩️ Вернуть' : '✓ Достигнуто';
      toggleBtn.setAttribute('aria-label', v.achieved ? 'Отменить достижение' : 'Отметить как достигнутое');
      toggleBtn.onclick = () => toggleVisionAchieved(v.id);
      actions.appendChild(toggleBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('aria-label', 'Удалить желание');
      deleteBtn.onclick = () => {
        if (confirm('Удалить это желание из карты?')) {
          deleteVision(v.id);
        }
      };
      actions.appendChild(deleteBtn);

      card.appendChild(actions);
      grid.appendChild(card);
    });

    categorySection.appendChild(grid);
    board.appendChild(categorySection);
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
  renderCoding();
  renderGoals();
  renderAchievements();
  renderProgram();
  renderTestHistory();
  renderVisionBoard();
  showRandomQuote();
  updateDashboard();
}

/* =========================
   CODING SESSIONS
========================= */
function addCodeSession() {
  const data = {
    date: document.getElementById('cDate').value,
    hours: parseFloat(document.getElementById('cHours').value) || 0,
    project: document.getElementById('cProject').value.trim(),
    tech: document.getElementById('cTech').value.trim()
  };

  if (!data.date || !data.hours || !data.project) {
    ui.showError('Заполните все обязательные поля');
    return;
  }

  if (storage.add('code', data)) {
    // Add XP for INT
    if (typeof statsManager !== 'undefined') {
      const xpAmount = Math.floor(data.hours * 20); // 20 XP per hour
      statsManager.addXP('INT', xpAmount);
    }
    ui.clearForm('codeForm');
    ui.setTodayDate('cDate');
    renderCoding();
    updateDashboard();
  }
}

function deleteCoding(id) {
  if (storage.delete('code', id)) {
    renderCoding();
    updateDashboard();
  }
}

function renderCoding() {
  const list = document.getElementById('codeList');
  if (!list) return;

  list.innerHTML = '';

  if (!storage.data.code || storage.data.code.length === 0) {
    list.innerHTML = '<li class="list-item">НЕТ СЕССИЙ КОДА</li>';
    return;
  }

  // Sort by date (newest first)
  const sorted = [...storage.data.code].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  sorted.forEach(c => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const content = document.createElement('div');
    content.className = 'list-item-content';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'list-item-date';
    dateSpan.textContent = ui.formatDate(c.date);

    const text = document.createElement('div');
    text.innerHTML = `<strong>${c.project}</strong><br>${c.hours}h${c.tech ? ` — ${c.tech}` : ''}`;

    content.appendChild(dateSpan);
    content.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    actions.appendChild(ui.createDeleteButton(c.id, deleteCoding));

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });

  // Render chart if canvas exists
  renderCodingChart();
}

function renderCodingChart() {
  const canvas = document.getElementById('codingChart');
  if (!canvas) return;

  // Simple chart - just show total hours per month
  const ctx = canvas.getContext('2d');

  // For now, just show a placeholder
  ctx.fillStyle = '#00ff41';
  ctx.font = '14px Share Tech Mono';
  ctx.textAlign = 'center';
  ctx.fillText('CODING CHART - Coming Soon', canvas.width / 2, canvas.height / 2);
}

/* =========================
   DASHBOARD UPDATES
========================= */
function updateDashboard() {
  // Update activity counts
  const workoutCount = storage.data.workouts ? storage.data.workouts.length : 0;
  const meditationCount = storage.data.meditations ? storage.data.meditations.length : 0;
  const codeCount = storage.data.code ? storage.data.code.length : 0;
  const goalsCount = storage.data.goals ? storage.data.goals.filter(g => !g.completed).length : 0;

  const workoutEl = document.getElementById('workout-count');
  if (workoutEl) workoutEl.textContent = workoutCount;

  const meditationEl = document.getElementById('meditation-count');
  if (meditationEl) meditationEl.textContent = meditationCount;

  const codeEl = document.getElementById('code-count');
  if (codeEl) codeEl.textContent = codeCount;

  const goalsEl = document.getElementById('goals-count');
  if (goalsEl) goalsEl.textContent = goalsCount;

  // Update dashboard goals list
  updateDashboardGoals();

  // Update today's program
  updateTodaysProgram();
}

function updateDashboardGoals() {
  const list = document.getElementById('dashboard-goals');
  if (!list) return;

  list.innerHTML = '';

  if (!storage.data.goals || storage.data.goals.length === 0) {
    list.innerHTML = '<li class="list-item" style="font-size: 12px; padding: 8px; color: var(--nexus-green-dim);">НЕТ АКТИВНЫХ МИССИЙ</li>';
    return;
  }

  const activeGoals = storage.data.goals.filter(g => !g.completed).slice(0, 3);

  if (activeGoals.length === 0) {
    list.innerHTML = '<li class="list-item" style="font-size: 12px; padding: 8px; color: var(--nexus-green-dim);">НЕТ АКТИВНЫХ МИССИЙ</li>';
    return;
  }

  activeGoals.forEach(g => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.style.fontSize = '12px';
    li.style.padding = '8px';

    const text = document.createElement('div');
    text.innerHTML = `<strong>${g.goal}</strong><br><span style="color: var(--nexus-green-dim);">ЦЕЛЬ: ${ui.formatDate(g.deadline)}</span>`;

    li.appendChild(text);
    list.appendChild(li);
  });
}

function updateTodaysProgram() {
  const container = document.getElementById('dashboard-program');
  if (!container) return;

  // Get today's day of week in Russian
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const today = days[new Date().getDay()];

  if (!storage.data.program) {
    container.innerHTML = '<p style="font-size: 12px; color: var(--nexus-green-dim); text-align: center; padding: 20px;">НА СЕГОДНЯ НЕТ УПРАЖНЕНИЙ</p>';
    return;
  }

  const todaysExercises = storage.data.program.filter(p => p.day === today);

  if (todaysExercises.length === 0) {
    container.innerHTML = '<p style="font-size: 12px; color: var(--nexus-green-dim); text-align: center; padding: 20px;">НА СЕГОДНЯ НЕТ УПРАЖНЕНИЙ</p>';
    return;
  }

  container.innerHTML = '';
  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = '0';

  todaysExercises.forEach((ex, idx) => {
    const li = document.createElement('li');
    li.style.padding = '8px';
    li.style.borderBottom = '1px solid var(--nexus-green-dark)';
    li.innerHTML = `<strong>${idx + 1}. ${ex.exercise}</strong><br>${ex.sets}x${ex.reps} @ ${ex.weight}kg`;
    list.appendChild(li);
  });

  container.appendChild(list);
}

function initializeDates() {
  ui.setTodayDate('wDate');
  ui.setTodayDate('mDate');
  ui.setTodayDate('cDate');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  initializeDates();
  renderAll();

  // Инициализация Personal Code системы
  if (typeof personalCodeManager !== 'undefined') {
    personalCodeManager.updateUI();
  }

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

/* =========================
   THEME TOGGLE
========================= */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('nexusTheme', newTheme);

  // Update theme toggle icon
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = newTheme === 'light' ? '☀️' : '🌙';
  }
}

// Toggle mobile menu
function toggleMenu() {
  const nav = document.getElementById('main-nav');
  const hamburger = document.getElementById('menu-toggle');

  if (nav) {
    nav.classList.toggle('nav-closed');
  }

  if (hamburger) {
    hamburger.classList.toggle('active');
  }
}

// Initialize theme from localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('nexusTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = savedTheme === 'light' ? '☀️' : '🌙';
  }
}

// Call initTheme before DOMContentLoaded
initTheme();

/* =========================
   PERSONAL CODE TEXT
========================= */
// Сохранить текстовый кодекс
function savePersonalCodeText() {
  const textarea = document.getElementById('personal-code-text');
  if (!textarea) return;

  const codeText = textarea.value;
  localStorage.setItem('nexusPersonalCodeText', codeText);

  // Показать статус сохранения
  const status = document.getElementById('code-save-status');
  if (status) {
    status.style.opacity = '1';
    setTimeout(() => {
      status.style.opacity = '0';
    }, 2000);
  }

  console.log('Personal Code saved:', codeText.length, 'characters');
}

// Загрузить текстовый кодекс
function loadPersonalCodeText() {
  const textarea = document.getElementById('personal-code-text');
  if (!textarea) return;

  const savedCode = localStorage.getItem('nexusPersonalCodeText');
  if (savedCode) {
    textarea.value = savedCode;
  }
}

// Очистить текстовый кодекс
function clearPersonalCodeText() {
  if (!confirm('Вы уверены, что хотите очистить свой персональный кодекс?')) {
    return;
  }

  const textarea = document.getElementById('personal-code-text');
  if (textarea) {
    textarea.value = '';
    localStorage.removeItem('nexusPersonalCodeText');
  }
}

// Автосохранение при вводе (debounced)
let codeTextTimeout;
function autoSavePersonalCodeText() {
  clearTimeout(codeTextTimeout);
  codeTextTimeout = setTimeout(() => {
    savePersonalCodeText();
  }, 1000);
}

// Добавить обработчик автосохранения при загрузке
document.addEventListener('DOMContentLoaded', () => {
  loadPersonalCodeText();

  const textarea = document.getElementById('personal-code-text');
  if (textarea) {
    // Автосохранение при вводе
    textarea.addEventListener('input', autoSavePersonalCodeText);
  }
});
