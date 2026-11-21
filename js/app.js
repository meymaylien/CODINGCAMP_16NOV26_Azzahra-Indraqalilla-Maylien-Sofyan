// ── Helpers ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── 1. THEME ──────────────────────────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = $('theme-toggle');

function applyTheme(t) {
  html.setAttribute('data-theme', t);
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', t);
}

themeBtn.addEventListener('click', () =>
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
);
applyTheme(localStorage.getItem('theme') || 'light');

// ── 2. CLOCK & GREETING ───────────────────────────────────────────────────────
let userName = localStorage.getItem('userName') || '';

function greetWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  $('clock').textContent = `${hh}:${mm}:${ss}`;
  $('datetime-date').textContent = now.toLocaleDateString('en-US', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  $('greeting-text').textContent = userName
    ? `${greetWord()}, ${userName}!`
    : `${greetWord()}!`;
}

$('name-input').value = userName;
$('name-form').addEventListener('submit', e => {
  e.preventDefault();
  userName = $('name-input').value.trim();
  localStorage.setItem('userName', userName);
  tick();
  toast('Name saved!');
});

tick();
setInterval(tick, 1000);

// ── 3. FOCUS TIMER ────────────────────────────────────────────────────────────
let timerMins = parseInt(localStorage.getItem('timerMins') || '25');
let totalSecs = timerMins * 60;
let secsLeft  = totalSecs;
let running   = false;
let interval  = null;

$('custom-min').value = timerMins;

function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function renderTimer() { $('timer-display').textContent = fmtTime(secsLeft); }

$('set-timer-btn').addEventListener('click', () => {
  const v = parseInt($('custom-min').value);
  if (!v || v < 1 || v > 120) { toast('Enter 1–120 minutes.'); return; }
  clearInterval(interval); running = false;
  timerMins = v; totalSecs = v * 60; secsLeft = totalSecs;
  localStorage.setItem('timerMins', v);
  $('timer-status').textContent = '';
  renderTimer();
  toast(`Timer set to ${v} min`);
});

$('start-btn').addEventListener('click', () => {
  if (running) return;
  if (secsLeft === 0) { secsLeft = totalSecs; renderTimer(); }
  running = true;
  $('timer-status').textContent = 'Running…';
  interval = setInterval(() => {
    secsLeft--;
    renderTimer();
    if (secsLeft <= 0) {
      clearInterval(interval); running = false;
      $('timer-status').textContent = '🎉 Session complete!';
      toast('⏰ Time is up!');
    }
  }, 1000);
});

$('stop-btn').addEventListener('click', () => {
  clearInterval(interval); running = false;
  $('timer-status').textContent = 'Paused';
});

$('reset-btn').addEventListener('click', () => {
  clearInterval(interval); running = false;
  secsLeft = totalSecs;
  $('timer-status').textContent = '';
  renderTimer();
});

renderTimer();

// ── 4. TO-DO LIST ─────────────────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

function renderTasks() {
  const list = $('todo-list');
  const sort = $('sort-select').value;
  let arr = [...tasks];
  if (sort === 'az')   arr.sort((a,b) => a.text.localeCompare(b.text));
  if (sort === 'done') arr.sort((a,b) => a.done - b.done);

  list.innerHTML = '';
  if (!arr.length) {
    list.innerHTML = '<p class="todo-empty">No tasks yet.</p>';
    return;
  }

  arr.forEach(task => {
    const realIdx = tasks.findIndex(t => t.id === task.id);
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = task.done;
    cb.addEventListener('change', () => {
      tasks[realIdx].done = cb.checked;
      saveTasks(); renderTasks();
    });

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️'; editBtn.title = 'Edit';
    editBtn.addEventListener('click', () => {
      span.contentEditable = 'true'; span.focus();
      const r = document.createRange();
      r.selectNodeContents(span);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(r);
      span.addEventListener('blur', () => {
        const t = span.textContent.trim();
        if (t) tasks[realIdx].text = t;
        span.contentEditable = 'false';
        saveTasks(); renderTasks();
      }, { once: true });
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️'; delBtn.title = 'Delete';
    delBtn.className = 'todo-del';
    delBtn.addEventListener('click', () => {
      tasks.splice(realIdx, 1);
      saveTasks(); renderTasks();
    });

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    list.appendChild(li);
  });
}

function addTask(text) {
  if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    toast('Task already exists!'); return;
  }
  tasks.push({ id: Date.now(), text, done: false });
  saveTasks(); renderTasks();
}

$('add-task-btn').addEventListener('click', () => {
  const v = $('task-input').value.trim();
  if (!v) { toast('Type a task first!'); return; }
  addTask(v); $('task-input').value = '';
});
$('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('add-task-btn').click(); });
$('sort-select').addEventListener('change', renderTasks);
renderTasks();

// ── 5. QUICK LINKS ────────────────────────────────────────────────────────────
let links = JSON.parse(localStorage.getItem('quickLinks') || 'null');
if (!links) {
  links = [
    { id: 1, name: 'Google',  url: 'https://google.com' },
    { id: 2, name: 'YouTube', url: 'https://youtube.com' },
    { id: 3, name: 'GitHub',  url: 'https://github.com' },
  ];
  localStorage.setItem('quickLinks', JSON.stringify(links));
}

function saveLinks() { localStorage.setItem('quickLinks', JSON.stringify(links)); }

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return ''; }
}

function renderLinks() {
  const grid = $('links-grid');
  grid.innerHTML = '';
  links.forEach((link, i) => {
    const a = document.createElement('a');
    a.className = 'link-pill';
    a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';

    const img = document.createElement('img');
    img.src = favicon(link.url);
    img.onerror = () => img.style.display = 'none';

    const label = document.createElement('span');
    label.textContent = link.name;

    const rm = document.createElement('button');
    rm.className = 'link-remove'; rm.textContent = '×'; rm.title = 'Remove';
    rm.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      links.splice(i, 1); saveLinks(); renderLinks();
    });

    a.append(img, label, rm);
    grid.appendChild(a);
  });
}

$('add-link-btn').addEventListener('click', () => {
  const name = $('link-name').value.trim();
  let url = $('link-url').value.trim();
  if (!name || !url) { toast('Fill in both label and URL.'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now(), name, url });
  saveLinks(); renderLinks();
  $('link-name').value = ''; $('link-url').value = '';
  toast('Link added!');
});

renderLinks();