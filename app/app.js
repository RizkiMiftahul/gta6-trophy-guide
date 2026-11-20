import { STORAGE_KEY, loadProgress, saveProgress, toggleEarned, exportProgress, importProgress, resetProgress, seedDemoProgress } from './state.js';
import { STAGES, GRADE_ORDER, loadTrophies, byStage, countsByGrade, platinumPath } from './data.js';
import { esc, HIDDEN_NAME, HIDDEN_DESCRIPTION, isSpoilerHidden, trophyCard, detailHTML, roadmapHTML, missablesHTML } from './render.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const tabs = [...document.querySelectorAll('.view-tabs [data-view]')];
const filterButtons = Object.fromEntries(['grade', 'kind'].map(key => [
  key, [...$(`${key}-filters`).querySelectorAll(`[data-${key}]`)],
]));
const spoilerToggle = $('toggle-spoiler');
const list = $('trophy-list');
const detail = $('trophy-detail');
const roadmap = $('roadmap-stages');
const warnings = $('missable-list');
const callout = document.querySelector('.missable-callout');
const placeholder = detail.innerHTML;

function storedProgressExists() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

const trophies = await loadTrophies().catch(error => {
  list.innerHTML = `<p class="empty-state">${esc(error.message)} Open the guide through its local server.</p>`;
  throw error;
});
const byId = new Map(trophies.map(t => [t.id, t]));
const validFilter = (key, value) => filterButtons[key].some(button => button.dataset[key] === value) ? value : 'all';
const state = {
  earned: params.get('demo') === '1' && !storedProgressExists() ? seedDemoProgress() : loadProgress(),
  view: 'checklist',
  grade: validFilter('grade', params.get('grade')),
  kind: validFilter('kind', params.get('kind')),
  missableOnly: false,
  hideEarned: false,
  spoiler: params.has('spoiler') ? params.get('spoiler') === 'on' : spoilerToggle.checked,
  query: params.get('q') ?? '',
  selected: byId.has(Number(params.get('open'))) ? Number(params.get('open')) : 17,
};

function renderProgress() {
  const counts = countsByGrade(trophies, state.earned);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const share = trophies.length ? total / trophies.length : 0;
  const ring = $('progress-ring-fg');
  ring.setAttribute('stroke-dashoffset', Number(ring.getAttribute('stroke-dasharray')) * (1 - share));
  $('progress-percent').textContent = `${Math.round(share * 100)}%`;
  $('progress-counts').textContent = `${total} of ${trophies.length} earned`;
  for (const grade of GRADE_ORDER) {
    $('grade-counts').querySelector(`[data-grade="${grade}"] strong`).textContent = counts[grade];
  }
  const path = platinumPath(trophies, state.earned) * 100;
  $('platinum-label').textContent = `Platinum path: ${Math.round(path)}%`;
  $('platinum-bar-fill').style.width = `${path}%`;
}

function renderList() {
  const query = state.query.trim().toLowerCase();
  const filtered = trophies.filter(t => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.missableOnly && !t.missable) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (!query) return true;
    const fields = isSpoilerHidden(t, state.earned, state.spoiler)
      ? [HIDDEN_NAME, HIDDEN_DESCRIPTION]
      : [t.name, t.description, t.target];
    return fields.some(field => String(field ?? '').toLowerCase().includes(query));
  });
  list.innerHTML = STAGES.map(stage => {
    const group = byStage(filtered, stage.n);
    if (!group.length) return '';
    return `<section class="stage-group"><h3>Stage ${stage.n} — ${esc(stage.title)}</h3>
      ${group.map(t => trophyCard(t, state.earned, state.spoiler)).join('')}</section>`;
  }).join('') || '<p class="empty-state">No trophies match these filters.</p>';
  markSelectedCard();
}

function markSelectedCard() {
  list.querySelector('.trophy-card.selected')?.classList.remove('selected');
  list.querySelector(`.trophy-card[data-id="${state.selected}"]`)?.classList.add('selected');
}

function renderDetail() {
  const selected = byId.get(state.selected);
  detail.innerHTML = selected ? detailHTML(selected, state.earned, state.spoiler) : placeholder;
}

function renderRoadmap() {
  roadmap.innerHTML = roadmapHTML(trophies, state.earned, state.spoiler);
  for (const item of callout.querySelectorAll('li')) {
    const trophy = byId.get(Number(item.querySelector('.trophy-number').textContent));
    item.hidden = Boolean(trophy && isSpoilerHidden(trophy, state.earned, state.spoiler));
  }
}

function renderMissables() {
  warnings.innerHTML = missablesHTML(trophies, state.earned, state.spoiler);
}

function showView(name) {
  state.view = tabs.some(tab => tab.dataset.view === name) ? name : 'checklist';
  for (const tab of tabs) {
    const active = tab.dataset.view === state.view;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
    $(tab.getAttribute('aria-controls')).hidden = !active;
  }
}

function refreshTrophies() {
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function changeEarned(id) {
  if (!byId.has(id)) return;
  toggleEarned(state.earned, id);
  saveProgress(state.earned);
  renderProgress();
  refreshTrophies();
}

function selectTrophy(id, revealDetail = false) {
  if (!byId.has(id)) return;
  state.selected = id;
  showView('checklist');
  markSelectedCard();
  renderDetail();
  detail.scrollTop = 0;
  if (revealDetail || matchMedia('(max-width: 820px)').matches) {
    detail.tabIndex = -1;
    detail.focus();
  }
}

function syncChips(key) {
  for (const button of filterButtons[key]) {
    const active = button.dataset[key] === state[key];
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  }
}

for (const key of ['grade', 'kind']) {
  syncChips(key);
  for (const button of filterButtons[key]) {
    button.addEventListener('click', () => {
      state[key] = button.dataset[key];
      syncChips(key);
      showView('checklist');
      renderList();
    });
  }
}

for (const [id, key] of [['filter-missable', 'missableOnly'], ['filter-hide-earned', 'hideEarned'], ['toggle-spoiler', 'spoiler']]) {
  const input = $(id);
  input.checked = state[key];
  input.addEventListener('change', () => {
    state[key] = input.checked;
    if (key === 'spoiler') refreshTrophies();
    else {
      showView('checklist');
      renderList();
    }
  });
}

const search = $('search');
search.value = state.query;
search.addEventListener('input', () => {
  state.query = search.value;
  showView('checklist');
  renderList();
});
for (const tab of tabs) tab.addEventListener('click', () => showView(tab.dataset.view));

list.addEventListener('click', event => {
  if (event.target.closest('input')) return;
  const card = event.target.closest('.trophy-card');
  if (card) selectTrophy(Number(card.dataset.id));
});
list.addEventListener('change', event => {
  const box = event.target.closest('input[data-action="toggle-earned"]');
  if (!box) return;
  changeEarned(Number(box.dataset.id));
  list.querySelector(`input[data-id="${Number(box.dataset.id)}"]`)?.focus({ preventScroll: true });
});
detail.addEventListener('click', event => {
  const button = event.target.closest('button[data-action="toggle-earned"]');
  if (!button) return;
  changeEarned(Number(button.dataset.id));
  detail.querySelector('button[data-action="toggle-earned"]')?.focus({ preventScroll: true });
});
for (const container of [roadmap, warnings]) {
  container.addEventListener('click', event => {
    const button = event.target.closest('[data-action="open-trophy"]');
    if (button) selectTrophy(Number(button.dataset.id), true);
  });
}

$('btn-export').addEventListener('click', () => exportProgress(state.earned));
$('import-file').addEventListener('change', async event => {
  const input = event.currentTarget;
  const file = input.files[0];
  if (!file) return;
  try {
    const imported = await importProgress(file);
    state.earned = new Set([...imported].filter(id => byId.has(id)));
    saveProgress(state.earned);
    renderProgress();
    refreshTrophies();
  } catch {
    alert('Could not import progress. Choose a JSON file with an array of earned trophy IDs.');
  } finally {
    input.value = '';
  }
});
$('btn-reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies for this guide?')) return;
  resetProgress();
  state.earned.clear();
  renderProgress();
  refreshTrophies();
});

renderProgress();
refreshTrophies();
showView(params.get('tab'));

if (params.get('demo') === '1') {
  setTimeout(() => {
    const checklistTarget = params.get('spoiler') === 'on' && !params.has('open')
      ? document.querySelector('.controls')
      : document.querySelector('.layout');
    const target = state.view === 'checklist' ? checklistTarget : $(`view-${state.view}`);
    const spoilerDemo = params.get('spoiler') === 'on' && !params.has('open');
    const spoilerListPeek = spoilerDemo ? 60 : 0;
    if (spoilerDemo) document.body.classList.add('demo-spoiler');
    if (state.view === 'roadmap') document.body.classList.add('demo-roadmap');
    document.querySelector('.site-wrap').style.transform = `translateY(-${Math.max(0, target.getBoundingClientRect().top + spoilerListPeek - 24)}px)`;
  }, 250);
}
