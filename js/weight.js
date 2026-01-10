/**
 * NEXUS OS - Weight Tracker
 * Система мониторинга веса с графиком и статистикой
 */

/**
 * Add new weight measurement
 */
function addWeight() {
  const date = document.getElementById('weightDate').value;
  const weight = parseFloat(document.getElementById('weightValue').value);
  const note = document.getElementById('weightNote').value;

  if (!date || !weight) {
    alert('Пожалуйста, заполните дату и вес.');
    return;
  }

  const weightData = {
    date: date,
    weight: weight,
    note: note,
    timestamp: new Date(date).getTime()
  };

  // Load existing data
  const history = getWeightHistory();
  history.push(weightData);

  // Sort by date
  history.sort((a, b) => a.timestamp - b.timestamp);

  // Save
  localStorage.setItem('nexusWeightHistory', JSON.stringify(history));

  // Clear form
  document.getElementById('weightValue').value = '';
  document.getElementById('weightNote').value = '';
  document.getElementById('weightDate').valueAsDate = new Date();

  // Update display
  updateWeightDisplay();

  // Show success message
  alert('✓ Вес добавлен: ' + weight + ' кг');
}

/**
 * Get weight history
 */
function getWeightHistory() {
  const data = localStorage.getItem('nexusWeightHistory');
  return data ? JSON.parse(data) : [];
}

/**
 * Set weight goal
 */
function setWeightGoal() {
  const goal = parseFloat(document.getElementById('goalWeightInput').value);

  if (!goal) {
    alert('Пожалуйста, введите целевой вес.');
    return;
  }

  localStorage.setItem('nexusWeightGoal', goal.toString());
  updateWeightDisplay();
  alert('✓ Целевой вес установлен: ' + goal + ' кг');
}

/**
 * Update weight display
 */
function updateWeightDisplay() {
  const history = getWeightHistory();
  const goal = parseFloat(localStorage.getItem('nexusWeightGoal') || '0');

  // Update stats
  if (history.length > 0) {
    const current = history[history.length - 1].weight;
    const starting = history[0].weight;
    const change = current - starting;

    document.getElementById('currentWeight').textContent = current.toFixed(1);
    document.getElementById('startingWeight').textContent = starting.toFixed(1);
    document.getElementById('weightChange').textContent = (change >= 0 ? '+' : '') + change.toFixed(1);
    document.getElementById('weightChange').style.color = change > 0 ? '#ff4444' : 'var(--nexus-green)';
  }

  if (goal > 0) {
    document.getElementById('goalWeight').textContent = goal.toFixed(1);
    document.getElementById('goalWeightInput').value = goal;

    // Update progress
    if (history.length > 0) {
      const current = history[history.length - 1].weight;
      const starting = history[0].weight;
      const totalChange = goal - starting;
      const currentChange = current - starting;
      const progress = totalChange !== 0 ? (currentChange / totalChange) * 100 : 0;

      const progressDiv = document.getElementById('goalProgress');
      progressDiv.style.display = 'block';

      document.getElementById('goalProgressPercent').textContent = Math.round(progress) + '%';
      document.getElementById('goalProgressBar').style.width = Math.min(Math.max(progress, 0), 100) + '%';

      const remaining = goal - current;
      document.getElementById('goalProgressText').textContent =
        remaining > 0 ? `Осталось сбросить: ${remaining.toFixed(1)} кг` :
        remaining < 0 ? `Превышение цели: ${Math.abs(remaining).toFixed(1)} кг` :
        'Цель достигнута! 🎉';
    }
  }

  // Update history
  renderWeightHistory();

  // Update chart
  renderWeightChart();
}

/**
 * Render weight history
 */
function renderWeightHistory() {
  const history = getWeightHistory();
  const container = document.getElementById('weightHistory');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="weight-history-empty">
        Нет измерений. Добавьте первое измерение веса.
      </div>
    `;
    return;
  }

  // Reverse to show newest first
  const reversed = [...history].reverse();

  const html = reversed.map((item, index) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calculate change from previous
    let changeHtml = '';
    if (index < reversed.length - 1) {
      const prev = reversed[index + 1].weight;
      const change = item.weight - prev;
      const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
      const changeSymbol = change > 0 ? '+' : '';
      changeHtml = `<div class="weight-history-change ${changeClass}">${changeSymbol}${change.toFixed(1)} кг</div>`;
    }

    return `
      <div class="weight-history-item">
        <div>
          <div class="weight-history-date">${dateStr}</div>
          ${item.note ? `<div class="weight-history-note">📝 ${item.note}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div class="weight-history-value">${item.weight.toFixed(1)} кг</div>
          ${changeHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Render weight chart (simple ASCII-style)
 */
function renderWeightChart() {
  const history = getWeightHistory();
  const container = document.getElementById('weightChart');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="weight-chart-empty">
        График будет доступен после добавления измерений
      </div>
    `;
    return;
  }

  // Get last 30 days or all data
  const data = history.slice(-30);

  // Find min and max
  const weights = data.map(d => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1;

  // Create simple line chart
  const chartHeight = 250;
  const chartWidth = container.offsetWidth || 800;
  const padding = 40;

  let svg = `
    <svg width="${chartWidth}" height="${chartHeight}" style="background: var(--nexus-surface); border-radius: var(--radius-sm);">
  `;

  // Draw grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight - padding * 2) * (i / 5);
    const value = maxWeight - (range * (i / 5));
    svg += `
      <line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}"
            stroke="var(--nexus-border)" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${padding - 5}" y="${y + 4}" fill="var(--nexus-text-dim)"
            font-size="10" text-anchor="end" font-family="var(--font-mono)">
        ${value.toFixed(1)}
      </text>
    `;
  }

  // Draw line
  const pointWidth = (chartWidth - padding * 2) / Math.max(data.length - 1, 1);

  let pathD = '';
  data.forEach((point, index) => {
    const x = padding + index * pointWidth;
    const normalizedValue = (point.weight - minWeight) / range;
    const y = padding + (chartHeight - padding * 2) * (1 - normalizedValue);

    if (index === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }

    // Draw point
    svg += `
      <circle cx="${x}" cy="${y}" r="4" fill="var(--nexus-green)" stroke="var(--nexus-black)" stroke-width="2">
        <title>${point.date}: ${point.weight.toFixed(1)} кг</title>
      </circle>
    `;
  });

  // Draw path
  svg += `
    <path d="${pathD}" fill="none" stroke="var(--nexus-green)" stroke-width="2" />
  `;

  // Draw goal line if set
  const goal = parseFloat(localStorage.getItem('nexusWeightGoal') || '0');
  if (goal > 0 && goal >= minWeight && goal <= maxWeight) {
    const normalizedGoal = (goal - minWeight) / range;
    const goalY = padding + (chartHeight - padding * 2) * (1 - normalizedGoal);
    svg += `
      <line x1="${padding}" y1="${goalY}" x2="${chartWidth - padding}" y2="${goalY}"
            stroke="var(--nexus-amber)" stroke-width="2" stroke-dasharray="8,4" />
      <text x="${chartWidth - padding - 5}" y="${goalY - 5}" fill="var(--nexus-amber)"
            font-size="11" text-anchor="end" font-family="var(--font-mono)">
        ЦЕЛЬ: ${goal.toFixed(1)} кг
      </text>
    `;
  }

  svg += '</svg>';
  container.innerHTML = svg;
}

/**
 * Clear weight history
 */
function clearWeightHistory() {
  if (!confirm('Вы уверены, что хотите удалить всю историю измерений веса?')) {
    return;
  }

  localStorage.removeItem('nexusWeightHistory');
  localStorage.removeItem('nexusWeightGoal');

  updateWeightDisplay();
  alert('✓ История очищена');
}

/**
 * Initialize weight tracker
 */
function initWeightTracker() {
  // Set today's date
  const dateInput = document.getElementById('weightDate');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Load and display data
  updateWeightDisplay();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('weightDate')) {
    initWeightTracker();
  }
});
