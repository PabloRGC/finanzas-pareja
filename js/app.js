const STORAGE_KEY = 'finanzasPareja.v1';
const CURRENCY = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const DATE_FMT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const defaultState = {
  settings: {
    initialBalance: 0,
    monthlyGoal: 0
  },
  categories: {
    expense: ['Alimentación', 'Salud', 'Transporte', 'Casa', 'Servicios', 'Deudas', 'Entretenimiento', 'Compras', 'Familia', 'Trabajo', 'Otros'],
    income: ['Sueldo', 'Freelance', 'Reembolso', 'Venta', 'Apoyo', 'Intereses', 'Otros']
  },
  transactions: []
};

let state = loadState();
let deferredPrompt = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      categories: { ...defaultState.categories, ...(parsed.categories || {}) },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
    };
  } catch (error) {
    console.error(error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  return toISODate(new Date());
}

function toISODate(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(value) {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date) {
  return endOfDay(new Date(date.getFullYear(), 11, 31));
}

function periodRange(period, base = new Date()) {
  const d = new Date(base);
  if (period === 'day') return { start: startOfDay(d), end: endOfDay(d), label: 'Día' };
  if (period === 'week') return { start: startOfWeek(d), end: endOfWeek(d), label: 'Semana' };
  if (period === 'month') return { start: startOfMonth(d), end: endOfMonth(d), label: 'Mes' };
  if (period === 'year') return { start: startOfYear(d), end: endOfYear(d), label: 'Año' };
  return { start: new Date(2000, 0, 1), end: new Date(2999, 11, 31), label: 'Todo' };
}

function transactionsInRange(start, end) {
  return state.transactions.filter((tx) => {
    const date = parseLocalDate(tx.date);
    return date >= start && date <= end;
  });
}

function sumByType(transactions, type) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

function totalBalance() {
  const income = sumByType(state.transactions, 'income');
  const expense = sumByType(state.transactions, 'expense');
  return Number(state.settings.initialBalance || 0) + income - expense;
}

function groupByCategory(transactions, type) {
  const map = new Map();
  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => map.set(tx.category, (map.get(tx.category) || 0) + Number(tx.amount || 0)));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function fillCategorySelects() {
  const expenseOptions = state.categories.expense.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
  const incomeOptions = state.categories.income.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
  $('#gastoCategory').innerHTML = expenseOptions;
  $('#ingresoCategory').innerHTML = incomeOptions;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function render() {
  renderResumen();
  renderAnalisis();
  renderHistory();
  $('#initialBalance').value = state.settings.initialBalance || '';
  $('#monthlyGoal').value = state.settings.monthlyGoal || '';
}

function renderResumen() {
  const period = $('#periodoResumen').value || 'month';
  const { start, end, label } = periodRange(period, new Date());
  const txs = transactionsInRange(start, end);
  const ingresos = sumByType(txs, 'income');
  const gastos = sumByType(txs, 'expense');
  const balance = ingresos - gastos;
  const savingsRate = ingresos > 0 ? Math.round((balance / ingresos) * 100) : 0;

  $('#saldoActual').textContent = CURRENCY.format(totalBalance());
  $('#resumenPeriodo').textContent = `${label}: ${DATE_FMT.format(start)} - ${DATE_FMT.format(end)}`;
  $('#statIngresos').textContent = CURRENCY.format(ingresos);
  $('#statGastos').textContent = CURRENCY.format(gastos);
  $('#statBalance').textContent = CURRENCY.format(balance);
  $('#statAhorro').textContent = `${Number.isFinite(savingsRate) ? savingsRate : 0}%`;
  $('#categoriaPeriodo').textContent = label;

  renderBars('#categoryBars', groupByCategory(txs, 'expense'), 'No hay gastos en este periodo.');
  renderSuggestions(txs, { ingresos, gastos, balance, savingsRate, period });
}

function renderBars(containerSelector, rows, emptyText) {
  const container = $(containerSelector);
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }
  const max = Math.max(...rows.map((row) => row.amount), 1);
  container.innerHTML = rows.map((row) => {
    const pct = Math.max(2, Math.round((row.amount / max) * 100));
    return `
      <div class="bar-row">
        <div class="bar-label"><span>${escapeHtml(row.category)}</span><strong>${CURRENCY.format(row.amount)}</strong></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

function renderSuggestions(txs, stats) {
  const suggestions = buildSuggestions(txs, stats);
  $('#suggestions').innerHTML = suggestions.map((item) => `
    <div class="suggestion">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.text)}</span>
    </div>
  `).join('');
}

function buildSuggestions(txs, stats) {
  const items = [];
  const expenseCats = groupByCategory(txs, 'expense');
  const topCat = expenseCats[0];
  const monthlyGoal = Number(state.settings.monthlyGoal || 0);

  if (!txs.length) {
    return [{ title: 'Empiecen simple', text: 'Registren todos los gastos e ingresos por 7 días. Con eso la app ya podrá dar sugerencias más útiles.' }];
  }

  if (stats.ingresos > 0 && stats.balance < 0) {
    items.push({ title: 'Alerta de balance', text: 'En este periodo gastaron más de lo que ingresó. Revisen gastos no esenciales antes de que termine el periodo.' });
  }

  if (stats.ingresos > 0 && stats.savingsRate < 10 && stats.balance > 0) {
    items.push({ title: 'Ahorro bajo', text: 'Su ahorro está por debajo del 10% de los ingresos del periodo. Intenten apartar una cantidad fija apenas entre dinero.' });
  }

  if (topCat && stats.gastos > 0) {
    const pct = Math.round((topCat.amount / stats.gastos) * 100);
    if (pct >= 35) {
      items.push({ title: `Mayor gasto: ${topCat.category}`, text: `Esta clasificación representa ${pct}% de los gastos. Pongan un límite semanal para controlarla sin sentirse restringidos.` });
    } else {
      items.push({ title: 'Gastos distribuidos', text: `La clasificación más alta es ${topCat.category}. No domina demasiado, pero conviene revisar si fue gasto planeado o impulsivo.` });
    }
  }

  if (monthlyGoal > 0) {
    const monthRange = periodRange('month', new Date());
    const monthTxs = transactionsInRange(monthRange.start, monthRange.end);
    const monthIncome = sumByType(monthTxs, 'income');
    const monthExpense = sumByType(monthTxs, 'expense');
    const monthBalance = monthIncome - monthExpense;
    if (monthBalance >= monthlyGoal) {
      items.push({ title: 'Meta mensual encaminada', text: 'Con el balance del mes actual ya van arriba de la meta de ahorro mensual configurada.' });
    } else {
      items.push({ title: 'Meta mensual', text: `Les faltan ${CURRENCY.format(Math.max(0, monthlyGoal - monthBalance))} para alcanzar la meta de ahorro mensual.` });
    }
  } else {
    items.push({ title: 'Configuren una meta', text: 'Pongan una meta mensual sencilla en Ajustes. Aunque sea pequeña, les ayudará a medir avance real.' });
  }

  const health = expenseCats.find((x) => x.category === 'Salud');
  if (health && stats.gastos > 0 && health.amount / stats.gastos >= 0.2) {
    items.push({ title: 'Salud e imprevistos', text: 'Salud pesa bastante en este periodo. Consideren crear un colchón separado para imprevistos médicos.' });
  }

  return items.slice(0, 4);
}

function renderAnalisis() {
  const frequency = $('#analysisFrequency').value || 'week';
  const base = parseLocalDate($('#analysisDate').value || todayISO());
  const { start, end, label } = periodRange(frequency, base);
  const txs = transactionsInRange(start, end);
  const ingresos = sumByType(txs, 'income');
  const gastos = sumByType(txs, 'expense');
  const balance = ingresos - gastos;
  const days = Math.max(1, Math.round((endOfDay(end) - startOfDay(start)) / 86400000) + 1);
  const average = gastos / days;

  $('#anaIngresos').textContent = CURRENCY.format(ingresos);
  $('#anaGastos').textContent = CURRENCY.format(gastos);
  $('#anaBalance').textContent = CURRENCY.format(balance);
  $('#anaPromedio').textContent = CURRENCY.format(average);
  $('#chartTitle').textContent = `Gastos por ${frequency === 'day' ? 'hora' : frequency === 'year' ? 'mes' : 'día'}`;
  $('#chartPill').textContent = `${label}: ${DATE_FMT.format(start)} - ${DATE_FMT.format(end)}`;
  $('#anaCatPill').textContent = label;
  $('#anaIncomePill').textContent = label;

  renderBars('#analysisCategoryBars', groupByCategory(txs, 'expense'), 'No hay gastos para analizar.');
  renderBars('#analysisIncomeBars', groupByCategory(txs, 'income'), 'No hay ingresos para analizar.');
  drawPeriodChart(txs, frequency, start, end);
}

function drawPeriodChart(txs, frequency, start, end) {
  const canvas = $('#periodChart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const points = buildChartPoints(txs, frequency, start, end);
  const pad = { left: 58, right: 22, top: 26, bottom: 72 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '24px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(CURRENCY.format(max), pad.left - 8, pad.top + 8);
  ctx.fillText('$0', pad.left - 8, pad.top + chartH + 6);

  const gap = Math.max(8, chartW / Math.max(points.length, 1) * 0.22);
  const barW = Math.max(14, (chartW / Math.max(points.length, 1)) - gap);

  points.forEach((point, index) => {
    const x = pad.left + index * (chartW / points.length) + gap / 2;
    const barH = (point.value / max) * chartH;
    const y = pad.top + chartH - barH;
    const radius = 10;

    ctx.fillStyle = '#2563eb';
    roundRect(ctx, x, y, barW, Math.max(3, barH), radius);
    ctx.fill();

    ctx.save();
    ctx.translate(x + barW / 2, pad.top + chartH + 18);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = '#64748b';
    ctx.font = '22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(point.label, 0, 0);
    ctx.restore();
  });

  if (!points.some((point) => point.value > 0)) {
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.font = '28px system-ui';
    ctx.fillText('Sin gastos en este periodo', width / 2, height / 2);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function buildChartPoints(txs, frequency, start, end) {
  if (frequency === 'day') {
    return Array.from({ length: 24 }, (_, hour) => {
      const value = txs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => {
        const txDate = new Date(`${tx.date}T${tx.time || '12:00'}:00`);
        return txDate.getHours() === hour ? sum + Number(tx.amount || 0) : sum;
      }, 0);
      return { label: `${hour}h`, value };
    });
  }

  if (frequency === 'year') {
    return Array.from({ length: 12 }, (_, month) => {
      const value = txs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => {
        const txDate = parseLocalDate(tx.date);
        return txDate.getMonth() === month ? sum + Number(tx.amount || 0) : sum;
      }, 0);
      return { label: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month], value };
    });
  }

  const points = [];
  const cursor = startOfDay(start);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    const value = txs
      .filter((tx) => tx.type === 'expense' && tx.date === iso)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const label = frequency === 'week'
      ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][points.length] || String(cursor.getDate())
      : String(cursor.getDate());
    points.push({ label, value });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

function renderHistory() {
  const filter = $('#historyFilter').value;
  const search = ($('#historySearch').value || '').toLowerCase().trim();
  const txs = [...state.transactions]
    .filter((tx) => filter === 'all' || tx.type === filter)
    .filter((tx) => !search || `${tx.category} ${tx.note}`.toLowerCase().includes(search))
    .sort((a, b) => `${b.date}${b.createdAt || ''}`.localeCompare(`${a.date}${a.createdAt || ''}`));

  if (!txs.length) {
    $('#historyList').innerHTML = '<div class="empty-state">No hay movimientos con ese filtro.</div>';
    return;
  }

  $('#historyList').innerHTML = txs.map((tx) => `
    <article class="history-item ${tx.type}">
      <div>
        <strong>${tx.type === 'income' ? '+' : '-'} ${CURRENCY.format(Number(tx.amount || 0))}</strong>
        <div class="history-meta">${escapeHtml(tx.category)} · ${DATE_FMT.format(parseLocalDate(tx.date))}</div>
        ${tx.note ? `<div class="history-meta">${escapeHtml(tx.note)}</div>` : ''}
      </div>
      <button class="delete-btn" type="button" data-delete="${tx.id}" aria-label="Eliminar movimiento">✕</button>
    </article>
  `).join('');
}

function addTransaction(type, amount, category, date, note) {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    showToast('Ingresa una cantidad válida.');
    return false;
  }

  state.transactions.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    amount: Number(numericAmount.toFixed(2)),
    category,
    date,
    note: note.trim(),
    time: new Date().toTimeString().slice(0, 5),
    createdAt: new Date().toISOString()
  });
  saveState();
  render();
  return true;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = [
    ['id', 'fecha', 'tipo', 'cantidad', 'categoria', 'nota'],
    ...state.transactions.map((tx) => [tx.id, tx.date, tx.type, tx.amount, tx.category, tx.note || ''])
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  downloadFile(`finanzas-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
}

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

function importCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return 0;
  const headers = rows[0].map((h) => normalizeHeader(h));
  let count = 0;
  const imported = [];

  rows.slice(1).forEach((row) => {
    const obj = {};
    headers.forEach((header, index) => obj[header] = row[index]);
    const typeRaw = String(obj.tipo || obj.type || '').toLowerCase();
    const amount = Number(String(obj.cantidad || obj.monto || obj.amount || '').replace(/[$,\s]/g, ''));
    const date = normalizeDate(obj.fecha || obj.date);
    const category = obj.categoria || obj.clasificacion || obj.category || obj.origen || 'Otros';
    const note = obj.nota || obj.note || obj.descripcion || '';
    const type = typeRaw.includes('ing') || typeRaw === 'income' ? 'income' : 'expense';
    if (amount > 0 && date) {
      imported.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        type,
        amount,
        category,
        date,
        note,
        time: '12:00',
        createdAt: new Date().toISOString()
      });
      count++;
    }
  });

  state.transactions.push(...imported);
  saveState();
  render();
  return count;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : toISODate(parsed);
}

function importJson(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data.transactions)) {
    state = {
      ...structuredClone(defaultState),
      ...data,
      settings: { ...defaultState.settings, ...(data.settings || {}) },
      categories: { ...defaultState.categories, ...(data.categories || {}) },
      transactions: data.transactions
    };
  } else if (Array.isArray(data)) {
    state.transactions.push(...data);
  } else {
    throw new Error('Formato no reconocido');
  }
  saveState();
  fillCategorySelects();
  render();
}

function showView(viewName) {
  $$('.view').forEach((view) => view.classList.remove('active'));
  $(`#view-${viewName}`).classList.add('active');
  $$('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function registerEvents() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('[data-open]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.open)));

  $('#periodoResumen').addEventListener('change', renderResumen);
  $('#analysisFrequency').addEventListener('change', renderAnalisis);
  $('#analysisDate').addEventListener('change', renderAnalisis);
  $('#historyFilter').addEventListener('change', renderHistory);
  $('#historySearch').addEventListener('input', renderHistory);

  $('#gastoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const ok = addTransaction('expense', $('#gastoAmount').value, $('#gastoCategory').value, $('#gastoDate').value, $('#gastoNote').value);
    if (ok) {
      event.target.reset();
      $('#gastoDate').value = todayISO();
      showToast('Gasto guardado.');
      showView('resumen');
    }
  });

  $('#ingresoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const ok = addTransaction('income', $('#ingresoAmount').value, $('#ingresoCategory').value, $('#ingresoDate').value, $('#ingresoNote').value);
    if (ok) {
      event.target.reset();
      $('#ingresoDate').value = todayISO();
      showToast('Ingreso guardado.');
      showView('resumen');
    }
  });

  $('#settingsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    state.settings.initialBalance = Number($('#initialBalance').value || 0);
    state.settings.monthlyGoal = Number($('#monthlyGoal').value || 0);
    saveState();
    render();
    showToast('Ajustes guardados.');
  });

  $('#historyList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const id = button.dataset.delete;
    if (!confirm('¿Eliminar este movimiento?')) return;
    state.transactions = state.transactions.filter((tx) => tx.id !== id);
    saveState();
    render();
    showToast('Movimiento eliminado.');
  });

  $('#exportJsonBtn').addEventListener('click', () => downloadFile(`respaldo-finanzas-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json'));
  $('#exportCsvBtn').addEventListener('click', exportCsv);

  $('#importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        importJson(text);
        showToast('Respaldo importado.');
      } else {
        const count = importCsv(text);
        showToast(`${count} movimientos importados.`);
      }
    } catch (error) {
      console.error(error);
      showToast('No se pudo importar el archivo.');
    } finally {
      event.target.value = '';
    }
  });

  $('#clearDataBtn').addEventListener('click', () => {
    const ok = confirm('Esto borrará todos los movimientos guardados en este navegador. ¿Continuar?');
    if (!ok) return;
    state = structuredClone(defaultState);
    saveState();
    fillCategorySelects();
    render();
    showToast('Datos borrados.');
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    $('#installBtn').classList.remove('hidden');
  });

  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#installBtn').classList.add('hidden');
  });
}

function init() {
  fillCategorySelects();
  $('#gastoDate').value = todayISO();
  $('#ingresoDate').value = todayISO();
  $('#analysisDate').value = todayISO();
  registerEvents();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(console.warn);
  }
}

init();
