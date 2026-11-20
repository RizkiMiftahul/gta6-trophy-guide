import { loadState, saveState, toggleEarned, setCount, exportJSON, importJSON, resetState, demoSeed, DEMO_KEY } from './state.js';
import { loadTrophies, auditStats } from './data.js';
import { renderAudit, renderTallies, renderList, renderDetail, renderNextUp, renderGuideSources, renderRoadmap, renderMissables, renderSources } from './render.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const demo = params.get('demo') === '1';
const data = await loadTrophies();
const state = loadState(demo);
if (demo && !localStorage.getItem(DEMO_KEY)) { Object.assign(state, demoSeed()); saveState(state, true); }
const stats = auditStats(data.trophies);
const ui = { kind: 'all', grades: new Set(), hideEarned: false, search: '', selected: Number(params.get('open')) || 28 };
if (!data.trophies.some(t => t.id === ui.selected)) ui.selected = 28;
const views = [...document.querySelectorAll('[data-view]')];
const byId = id => data.trophies.find(t => t.id === Number(id));

function renderAll() {
  renderTallies(data, state);
  renderList($('trophy-list'), data, state, ui);
  renderDetail($('trophy-detail'), byId(ui.selected), state);
  renderNextUp($('next-up'), data, state);
  renderGuideSources($('guide-sources'), byId(ui.selected));
  renderRoadmap($('roadmap-stages'), data, state);
  renderMissables($('missable-list'), data, state);
  renderSources($('sources-matrix'), data, stats);
}
function persist() { saveState(state, demo); renderAll(); }
function showView(view) {
  const selected = views.some(button => button.dataset.view === view) ? view : 'tracker';
  for (const button of views) {
    const active = button.dataset.view === selected;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    $(button.getAttribute('aria-controls')).hidden = !active;
  }
}
renderAudit($('audit-line'), data, stats);
renderAll();
showView(params.get('tab') || 'tracker');
$('btn-spoiler').checked = state.spoiler;

for (const button of views) button.addEventListener('click', () => showView(button.dataset.view));
$('kind-filters').addEventListener('click', event => { const button = event.target.closest('[data-kind]'); if (!button) return; ui.kind = button.dataset.kind; $('kind-filters').querySelectorAll('[data-kind]').forEach(item => item.classList.toggle('active', item === button)); renderAll(); });
$('grade-filters').addEventListener('click', event => { const button = event.target.closest('[data-grade]'); if (!button) return; ui.grades.has(button.dataset.grade) ? ui.grades.delete(button.dataset.grade) : ui.grades.add(button.dataset.grade); button.classList.toggle('active', ui.grades.has(button.dataset.grade)); renderList($('trophy-list'), data, state, ui); });
$('search').addEventListener('input', event => { ui.search = event.target.value; renderList($('trophy-list'), data, state, ui); });
$('filter-hide-earned').addEventListener('change', event => { ui.hideEarned = event.target.checked; renderList($('trophy-list'), data, state, ui); });
$('btn-spoiler').addEventListener('change', event => { state.spoiler = event.target.checked; persist(); });
$('trophy-list').addEventListener('click', event => { const box = event.target.closest('input[data-action="toggle-earned"]'); if (box) return; const row = event.target.closest('.trophy-card'); if (row) { ui.selected = Number(row.dataset.id); renderAll(); } });
$('trophy-list').addEventListener('change', event => { const box = event.target.closest('input[data-action="toggle-earned"]'); if (!box) return; const next = toggleEarned(state, Number(box.dataset.id)); Object.assign(state, next); persist(); });
$('trophy-detail').addEventListener('click', event => { const earned = event.target.closest('[data-action="toggle-earned"]'); const counter = event.target.closest('[data-count]'); if (earned) Object.assign(state, toggleEarned(state, Number(earned.dataset.id))); if (counter) { const t = byId(ui.selected); Object.assign(state, setCount(state, t.id, (state.counts[t.id] || 0) + Number(counter.dataset.count), t.targetCount)); } if (earned || counter) persist(); });
for (const selector of ['#next-up', '#roadmap-stages', '#missable-list', '#sources-matrix']) $(selector.slice(1)).addEventListener('click', event => { const target = event.target.closest('[data-id]'); if (target && byId(target.dataset.id)) { ui.selected = Number(target.dataset.id); showView('tracker'); renderAll(); } });
$('btn-export').addEventListener('click', () => exportJSON(state));
$('btn-import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; const imported = importJSON(await file.text()); if (!imported) alert('Invalid progress file.'); else { Object.assign(state, imported); persist(); } event.target.value = ''; });
$('btn-reset').addEventListener('click', () => { if (!confirm('Reset trophy progress?')) return; Object.assign(state, resetState(demo)); persist(); });
