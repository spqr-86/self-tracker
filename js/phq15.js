/**
 * NEXUS OS - PHQ-15 Psychological Test
 * Patient Health Questionnaire-15 для оценки соматических симптомов
 */

/**
 * Calculate PHQ-15 test result
 */
function calculatePHQ15() {
  const form = document.getElementById('phq15Form');

  // Validate form
  if (!form.checkValidity()) {
    alert('Пожалуйста, ответьте на все вопросы.');
    return;
  }

  // Calculate total score
  let totalScore = 0;
  for (let i = 1; i <= 15; i++) {
    const answer = form.querySelector(`input[name="q${i}"]:checked`);
    if (answer) {
      totalScore += parseInt(answer.value);
    }
  }

  // Save result
  savePHQ15Result(totalScore);

  // Display result
  displayPHQ15Result(totalScore);

  // Scroll to result
  document.getElementById('phq15Result').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display PHQ-15 result with interpretation
 */
function displayPHQ15Result(score) {
  // Show result container
  const resultDiv = document.getElementById('phq15Result');
  resultDiv.style.display = 'block';

  // Display score
  document.getElementById('phq15Score').textContent = score;

  // Display date
  const now = new Date();
  document.getElementById('phq15Date').textContent = now.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Interpretation
  let interpretation = '';
  let severity = '';
  let color = '';

  if (score <= 4) {
    severity = 'Минимальный уровень';
    color = 'var(--nexus-green)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ✓ ${severity} соматических симптомов
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>минимальный уровень</strong> физических симптомов.
        Это нормальный показатель, который не вызывает беспокойства.
      </p>
    `;
  } else if (score <= 9) {
    severity = 'Низкий уровень';
    color = 'var(--nexus-green)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ⚠️ ${severity} соматических симптомов
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>низкий уровень</strong> физических симптомов.
        Некоторые симптомы присутствуют, но находятся в пределах нормы.
        Рекомендуется следить за своим самочувствием.
      </p>
    `;
  } else if (score <= 14) {
    severity = 'Средний уровень';
    color = 'var(--nexus-amber)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ⚠️ ${severity} соматических симптомов
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>средний уровень</strong> физических симптомов.
        Рекомендуется обратить внимание на свое здоровье и проконсультироваться с врачом,
        если симптомы сохраняются или усиливаются.
      </p>
    `;
  } else {
    severity = 'Высокий уровень';
    color = '#ff4444';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        🚨 ${severity} соматических симптомов
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>высокий уровень</strong> физических симптомов.
        <strong>Настоятельно рекомендуется обратиться к врачу</strong> для полного обследования
        и выявления возможных причин симптомов.
      </p>
    `;
  }

  document.getElementById('phq15Interpretation').innerHTML = interpretation;

  // Recommendations
  const recommendations = `
    <h4 style="color: var(--nexus-green); margin-bottom: 12px;">Рекомендации</h4>
    <ul style="font-size: 13px; line-height: 1.8; padding-left: 20px;">
      <li>Ведите дневник симптомов, отмечая их частоту и интенсивность</li>
      <li>Обратите внимание на связь симптомов со стрессом и эмоциями</li>
      <li>Практикуйте техники релаксации (медитация, дыхательные упражнения)</li>
      <li>Поддерживайте регулярный режим сна и физической активности</li>
      <li>Избегайте чрезмерного употребления кофеина и алкоголя</li>
      ${score > 9 ? '<li><strong>Проконсультируйтесь с врачом или психотерапевтом</strong></li>' : ''}
    </ul>
    <div style="margin-top: 16px; padding: 12px; background: var(--nexus-black); border-left: 3px solid var(--nexus-green); font-size: 12px; line-height: 1.6;">
      <strong>Важно:</strong> Этот тест является инструментом скрининга и не заменяет профессиональной
      медицинской диагностики. При наличии серьезных симптомов обратитесь к врачу.
    </div>
  `;

  document.getElementById('phq15Recommendations').innerHTML = recommendations;
}

/**
 * Save PHQ-15 result to history
 */
function savePHQ15Result(score) {
  const history = JSON.parse(localStorage.getItem('nexusPHQ15History') || '[]');

  const result = {
    date: new Date().toISOString(),
    score: score,
    severity: score <= 4 ? 'Минимальный' : score <= 9 ? 'Низкий' : score <= 14 ? 'Средний' : 'Высокий'
  };

  history.push(result);

  // Keep last 20 results
  if (history.length > 20) {
    history.shift();
  }

  localStorage.setItem('nexusPHQ15History', JSON.stringify(history));
}

/**
 * Show PHQ-15 history
 */
function showPHQ15History() {
  const historyDiv = document.getElementById('phq15History');
  const contentDiv = document.getElementById('phq15HistoryContent');

  const history = JSON.parse(localStorage.getItem('nexusPHQ15History') || '[]');

  if (history.length === 0) {
    contentDiv.innerHTML = `
      <p style="text-align: center; color: var(--nexus-text-dim); padding: 32px;">
        История тестов пуста. Пройдите тест, чтобы начать отслеживание.
      </p>
    `;
  } else {
    // Reverse to show newest first
    const sortedHistory = [...history].reverse();

    const historyHTML = sortedHistory.map((result, index) => {
      const date = new Date(result.date);
      const dateStr = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const color = result.score <= 4 ? 'var(--nexus-green)' :
                    result.score <= 9 ? 'var(--nexus-green)' :
                    result.score <= 14 ? 'var(--nexus-amber)' : '#ff4444';

      return `
        <div style="
          background: var(--nexus-surface);
          border: 1px solid var(--nexus-border);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-size: 13px; color: var(--nexus-text-dim); margin-bottom: 4px;">
              ${dateStr} в ${timeStr}
            </div>
            <div style="font-size: 14px; color: ${color}; font-weight: 600;">
              ${result.severity} уровень
            </div>
          </div>
          <div style="font-size: 28px; color: ${color}; font-weight: 700;">
            ${result.score}
          </div>
        </div>
      `;
    }).join('');

    contentDiv.innerHTML = historyHTML;
  }

  // Toggle visibility
  if (historyDiv.style.display === 'none' || historyDiv.style.display === '') {
    historyDiv.style.display = 'block';
    historyDiv.scrollIntoView({ behavior: 'smooth' });
  } else {
    historyDiv.style.display = 'none';
  }
}
