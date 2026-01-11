/**
 * NEXUS OS - Depression Test
 * Психологический тест для оценки уровня депрессии (15 вопросов)
 */

/**
 * Calculate Depression test result
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
 * Display Depression test result with interpretation
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

  // Interpretation based on depression scale
  // 15 questions × 3 max = 45 max score
  let interpretation = '';
  let severity = '';
  let color = '';

  if (score <= 7) {
    severity = 'Минимальный уровень';
    color = 'var(--nexus-green)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ✓ ${severity} депрессии
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>минимальный уровень</strong> депрессивных симптомов.
        Это нормальный показатель, который не вызывает беспокойства. Продолжайте заботиться
        о своем психическом здоровье через здоровый образ жизни и позитивные активности.
      </p>
    `;
  } else if (score <= 14) {
    severity = 'Легкая депрессия';
    color = 'var(--nexus-amber)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ⚠️ ${severity}
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>легкую депрессию</strong>.
        Некоторые депрессивные симптомы присутствуют, но они еще не серьезны.
        Рекомендуется обратить внимание на свое эмоциональное состояние и принять
        меры для улучшения самочувствия. Рассмотрите возможность консультации со специалистом.
      </p>
    `;
  } else if (score <= 22) {
    severity = 'Умеренная депрессия';
    color = 'var(--nexus-amber)';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        ⚠️ ${severity}
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>умеренную депрессию</strong>.
        Депрессивные симптомы значительно влияют на вашу повседневную жизнь.
        <strong>Рекомендуется обратиться к психологу или психотерапевту</strong> для
        получения профессиональной помощи и поддержки.
      </p>
    `;
  } else if (score <= 30) {
    severity = 'Умеренно-тяжелая депрессия';
    color = '#ff4444';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        🚨 ${severity}
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>умеренно-тяжелую депрессию</strong>.
        Депрессивные симптомы серьезно влияют на качество вашей жизни.
        <strong>Настоятельно рекомендуется обратиться к специалисту</strong> (психотерапевту или психиатру)
        для получения профессиональной помощи. Могут потребоваться психотерапия и/или медикаментозное лечение.
      </p>
    `;
  } else {
    severity = 'Тяжелая депрессия';
    color = '#ff4444';
    interpretation = `
      <div style="color: ${color}; font-size: 18px; font-weight: 700; margin-bottom: 12px;">
        🚨 ${severity}
      </div>
      <p style="font-size: 14px; line-height: 1.6;">
        Ваш результат указывает на <strong>тяжелую депрессию</strong>.
        <strong>Срочно обратитесь к психиатру или психотерапевту!</strong>
        При тяжелой депрессии необходима профессиональная помощь, включая психотерапию
        и медикаментозное лечение. Если у вас есть суицидальные мысли, немедленно
        обратитесь за экстренной помощью.
      </p>
    `;
  }

  document.getElementById('phq15Interpretation').innerHTML = interpretation;

  // Recommendations
  const recommendations = `
    <h4 style="color: var(--nexus-green); margin-bottom: 12px;">Рекомендации</h4>
    <ul style="font-size: 13px; line-height: 1.8; padding-left: 20px;">
      <li>Поддерживайте регулярный режим сна (7-9 часов в сутки)</li>
      <li>Занимайтесь физической активностью (даже короткие прогулки помогают)</li>
      <li>Практикуйте техники релаксации (медитация, дыхательные упражнения, йога)</li>
      <li>Общайтесь с близкими людьми, не изолируйтесь</li>
      <li>Избегайте алкоголя и психоактивных веществ</li>
      <li>Ведите дневник эмоций для отслеживания изменений в настроении</li>
      ${score > 7 ? '<li><strong>Обратитесь к психологу или психотерапевту для профессиональной помощи</strong></li>' : ''}
      ${score > 22 ? '<li><strong>Рассмотрите возможность консультации с психиатром</strong></li>' : ''}
      ${score > 30 ? '<li style="color: #ff4444;"><strong>При наличии суицидальных мыслей немедленно звоните 112 или на телефон доверия</strong></li>' : ''}
    </ul>
    <div style="margin-top: 16px; padding: 12px; background: var(--nexus-black); border-left: 3px solid var(--nexus-green); font-size: 12px; line-height: 1.6;">
      <strong>Важно:</strong> Этот тест является инструментом скрининга и не заменяет профессиональной
      психологической или психиатрической диагностики. Для точной диагностики и лечения обратитесь к специалисту.
    </div>
  `;

  document.getElementById('phq15Recommendations').innerHTML = recommendations;
}

/**
 * Save Depression test result to history
 */
function savePHQ15Result(score) {
  const history = JSON.parse(localStorage.getItem('nexusPHQ15History') || '[]');

  const result = {
    date: new Date().toISOString(),
    score: score,
    severity: score <= 7 ? 'Минимальный' :
              score <= 14 ? 'Легкая' :
              score <= 22 ? 'Умеренная' :
              score <= 30 ? 'Умеренно-тяжелая' : 'Тяжелая'
  };

  history.push(result);

  // Keep last 20 results
  if (history.length > 20) {
    history.shift();
  }

  localStorage.setItem('nexusPHQ15History', JSON.stringify(history));
}

/**
 * Show Depression test history
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

      const color = result.score <= 7 ? 'var(--nexus-green)' :
                    result.score <= 14 ? 'var(--nexus-amber)' :
                    result.score <= 22 ? 'var(--nexus-amber)' : '#ff4444';

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
              ${result.severity}
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
