const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const QUOTES = [
  { text: "El dinero ahorrado hoy es la libertad de mañana.", author: "— Proverbio financiero" },
  { text: "No es cuánto ganas, sino cuánto guardas lo que construye tu futuro.", author: "— Robert Kiyosaki" },
  { text: "Un pequeño ahorro diario se convierte en una gran fortuna con el tiempo.", author: "— Benjamin Franklin" },
  { text: "La disciplina es el puente entre metas y logros.", author: "— Jim Rohn" },
  { text: "Cada peso que ahorras es un soldado que trabaja para ti mientras duermes.", author: "— Warren Buffett (adaptado)" },
  { text: "El secreto del éxito financiero está en los hábitos que repites cada día.", author: "— Dave Ramsey" },
  { text: "No esperes el momento perfecto para ahorrar. El momento es ahora.", author: "— Suze Orman" },
  { text: "Vivir por debajo de tus posibilidades es el mayor lujo que puedes darte.", author: "— Anónimo" },
  { text: "Tu yo del futuro te agradecerá cada sacrificio que hagas hoy.", author: "— Anónimo" },
  { text: "El ahorro no es privarte de cosas, es elegir tu libertad.", author: "— Anónimo" },
];

let state = {
  title: 'Mi Meta Financiera',
  metaDesc: '',
  metaGoal: '',
  metaDate: '',
  dailySavings: {},   // "YYYY-MM-DD": amount
  weeklySavings: {},  // "W-NUM": { amount, note }
  monthlySavings: {}, // "M-NUM": amount
  notes: '',
  quoteIndex: 0,
};

let pendingDay = null;
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

// ===== INIT =====
function init() {
  loadData();
  renderDaily();
  renderWeekly();
  renderMonthly();
  renderQuote();
  syncUI();
  document.getElementById('main-title').textContent = state.title;
  document.getElementById('meta-desc').value = state.metaDesc;
  document.getElementById('meta-goal').value = state.metaGoal;
  document.getElementById('meta-date').value = state.metaDate;
  document.getElementById('notes').value = state.notes;
  updateProgress();
  // Live update on inputs
  ['meta-desc','meta-goal','meta-date'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      state.metaDesc = document.getElementById('meta-desc').value;
      state.metaGoal = document.getElementById('meta-goal').value;
      state.metaDate = document.getElementById('meta-date').value;
      updateProgress();
    });
  });
  document.getElementById('notes').addEventListener('input', e => { state.notes = e.target.value; });
}

// ===== DAILY =====
function renderDaily() {
  const container = document.getElementById('daily-grid');
  container.innerHTML = '';
  const year = today.getFullYear();
  for (let m = 0; m < 12; m++) {
    const label = document.createElement('div');
    label.className = 'month-label';
    label.textContent = MONTHS[m] + ' ' + year;
    container.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'days-grid';

    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cell = document.createElement('div');
      cell.className = 'day-cell' + (key === todayKey ? ' today' : '') + (state.dailySavings[key] !== undefined ? ' saved' : '');
      cell.dataset.key = key;
      cell.dataset.label = `${d} de ${MONTHS[m]}`;
      const amt = state.dailySavings[key];
      cell.innerHTML = `<span class="day-num">${d}</span>${amt ? `<span class="day-amt">$${amt}</span>` : ''}${amt ? `<span class="day-check">✓</span>` : ''}`;
      cell.addEventListener('click', () => openModal(key, cell.dataset.label));
      grid.appendChild(cell);
    }
    container.appendChild(grid);
  }
}

// ===== WEEKLY =====
function renderWeekly() {
  const tbody = document.getElementById('week-tbody');
  tbody.innerHTML = '';
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const totalWeeks = 52;

  for (let w = 1; w <= totalWeeks; w++) {
    const startDay = new Date(jan1);
    startDay.setDate(jan1.getDate() + (w - 1) * 7);
    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + 6);

    const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;
    const key = `W-${w}`;
    const wData = state.weeklySavings[key] || { amount: '', note: '' };
    const goal = parseFloat(state.metaGoal) || 0;
    const weekTarget = goal > 0 ? (goal / totalWeeks) : 0;
    const pct = weekTarget > 0 ? Math.min((parseFloat(wData.amount)||0) / weekTarget * 100, 100) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:'Playfair Display',serif;color:var(--gold)">S${w}</strong></td>
      <td style="color:var(--text-muted);font-size:12px">${fmt(startDay)} – ${fmt(endDay)}</td>
      <td>
        <input class="week-input" type="number" placeholder="$0" value="${wData.amount}" data-key="${key}" data-field="amount" oninput="updateWeek(this)" min="0">
      </td>
      <td>
        <input class="week-input" type="text" placeholder="Nota..." value="${wData.note||''}" data-key="${key}" data-field="note" oninput="updateWeek(this)" style="font-size:13px">
      </td>
      <td style="min-width:80px">
        <div class="week-bar"><div class="week-bar-fill" id="wbar-${w}" style="width:${pct}%"></div></div>
        <span style="font-size:10px;color:var(--text-muted);margin-top:3px;display:block">${Math.round(pct)}%</span>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function updateWeek(input) {
  const key = input.dataset.key;
  const field = input.dataset.field;
  if (!state.weeklySavings[key]) state.weeklySavings[key] = { amount: '', note: '' };
  state.weeklySavings[key][field] = input.value;
  updateProgress();
}

// ===== MONTHLY =====
function renderMonthly() {
  const grid = document.getElementById('months-grid');
  grid.innerHTML = '';
  const goal = parseFloat(state.metaGoal) || 0;
  const monthTarget = goal > 0 ? (goal / 12) : 0;

  MONTHS.forEach((name, i) => {
    const key = `M-${i}`;
    const saved = parseFloat(state.monthlySavings[key]) || 0;
    const pct = monthTarget > 0 ? Math.min(saved / monthTarget * 100, 100) : 0;
    const done = saved >= monthTarget && monthTarget > 0;

    const card = document.createElement('div');
    card.className = 'month-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="month-name">${name}</div>
      <input class="month-amt-input" type="number" placeholder="$0" value="${state.monthlySavings[key]||''}" data-key="${key}" oninput="updateMonth(this)" min="0">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Meta: $${monthTarget > 0 ? monthTarget.toFixed(0) : '—'}</div>
      <div class="month-mini-bar"><div class="month-mini-fill" id="mbar-${i}" style="width:${pct}%"></div></div>
    `;
    grid.appendChild(card);
  });
}

function updateMonth(input) {
  const key = input.dataset.key;
  state.monthlySavings[key] = input.value;
  const i = parseInt(key.split('-')[1]);
  const goal = parseFloat(state.metaGoal) || 0;
  const monthTarget = goal > 0 ? (goal / 12) : 0;
  const saved = parseFloat(input.value) || 0;
  const pct = monthTarget > 0 ? Math.min(saved / monthTarget * 100, 100) : 0;
  const bar = document.getElementById(`mbar-${i}`);
  if (bar) bar.style.width = pct + '%';
  const card = input.closest('.month-card');
  if (card) card.className = 'month-card' + (saved >= monthTarget && monthTarget > 0 ? ' done' : '');
  updateProgress();
}

// ===== PROGRESS =====
function updateProgress() {
  // Sum all sources
  let total = 0;
  Object.values(state.dailySavings).forEach(v => total += parseFloat(v) || 0);
  Object.values(state.weeklySavings).forEach(v => total += parseFloat(v.amount) || 0);
  Object.values(state.monthlySavings).forEach(v => total += parseFloat(v) || 0);

  const goal = parseFloat(state.metaGoal) || 0;
  const pct = goal > 0 ? Math.min(total / goal * 100, 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('pct-text').textContent = pct.toFixed(1) + '%';

  const days = Object.keys(state.dailySavings).length;
  document.getElementById('stat-total').textContent = '$' + total.toLocaleString('es-CO', {maximumFractionDigits:0});
  document.getElementById('stat-days').textContent = days;
  const left = Math.max(goal - total, 0);
  document.getElementById('stat-left').textContent = '$' + left.toLocaleString('es-CO', {maximumFractionDigits:0});
}

// ===== MODAL =====
function openModal(key, label) {
  pendingDay = key;
  document.getElementById('modal-day-label').textContent = '📅 ' + label;
  const existing = state.dailySavings[key];
  document.getElementById('modal-amount').value = existing !== undefined ? existing : '';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('modal-amount').focus(), 100);
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  pendingDay = null;
}

function confirmDay() {
  if (!pendingDay) return;
  const val = parseFloat(document.getElementById('modal-amount').value);
  if (isNaN(val) || val < 0) { showToast('Ingresa un monto válido'); return; }
  if (val === 0) {
    delete state.dailySavings[pendingDay];
  } else {
    state.dailySavings[pendingDay] = val;
  }
  closeModal();
  renderDaily();
  updateProgress();
  showToast('✓ Día registrado con éxito');
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.getElementById('modal-amount').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmDay();
});

// ===== TABS =====
function switchTab(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  btn.classList.add('active');
}

// ===== QUOTE =====
function renderQuote() {
  const q = QUOTES[state.quoteIndex % QUOTES.length];
  document.getElementById('quote-text').textContent = `"${q.text}"`;
  document.getElementById('quote-author').textContent = q.author;
}

function nextQuote() {
  state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
  const el = document.getElementById('quote-text');
  el.style.opacity = '0';
  setTimeout(() => { renderQuote(); el.style.opacity = '1'; }, 200);
}

// ===== TITLE EDIT =====
function toggleTitleEdit() {
  const el = document.getElementById('main-title');
  const btn = event.target;
  if (el.contentEditable === 'true') {
    el.contentEditable = 'false';
    state.title = el.textContent;
    btn.textContent = '✏️ Editar';
    showToast('Título actualizado');
  } else {
    el.contentEditable = 'true';
    el.focus();
    btn.textContent = '✓ Guardar';
    // Select all
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

// ===== SAVE / LOAD =====
function saveData() {
  state.title = document.getElementById('main-title').textContent;
  state.metaDesc = document.getElementById('meta-desc').value;
  state.metaGoal = document.getElementById('meta-goal').value;
  state.metaDate = document.getElementById('meta-date').value;
  state.notes = document.getElementById('notes').value;
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mis-ahorros.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('💾 Guardado descargado correctamente');
  } catch(e) {
    showToast('Error al guardar');
  }
}

function loadData() {
  // Try sessionStorage fallback
  try {
    const raw = sessionStorage.getItem('savings-calendar');
    if (raw) { Object.assign(state, JSON.parse(raw)); }
  } catch(e) {}
}

function syncUI() {
  // Auto-save to sessionStorage on any change
  setInterval(() => {
    state.title = document.getElementById('main-title').textContent;
    state.notes = document.getElementById('notes').value;
    try { sessionStorage.setItem('savings-calendar', JSON.stringify(state)); } catch(e) {}
  }, 3000);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Import file
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = ev => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = re => {
        try {
          const data = JSON.parse(re.result);
          Object.assign(state, data);
          document.getElementById('main-title').textContent = state.title;
          document.getElementById('meta-desc').value = state.metaDesc;
          document.getElementById('meta-goal').value = state.metaGoal;
          document.getElementById('meta-date').value = state.metaDate;
          document.getElementById('notes').value = state.notes;
          renderDaily(); renderWeekly(); renderMonthly(); updateProgress();
          showToast('📂 Datos cargados correctamente');
        } catch(err) { showToast('Archivo inválido'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }
});

init();
