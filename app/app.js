import { loadState, saveState, toggleEarned, setCount, exportJSON, importJSON, resetState, demoSeed, DEMO_KEY } from './state.js';
import { loadTrophies, auditStats } from './data.js';
import { renderAudit, renderTallies, renderList, renderDetail, renderNextUp, renderGuideSources, renderRoadmap, renderMissables, renderSources } from './render.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const demo = params.get('demo') === '1';

async function boot() {
  const data = await loadTrophies();
  let state = loadState(demo);
  if (demo) {
    let empty = true;
    try { empty = localStorage.getItem(DEMO_KEY) === null; } catch { /* Use a session demo. */ }
    if (empty) { state = demoSeed(); saveState(state, true); }
  }
  const stats = auditStats(data.trophies);
  const byId = id => data.trophies.find(t => t.id === Number(id));
  const ui = { kind: 'all', grades: new Set(), hideEarned: false, search: '', selected: Number(params.get('open')) || 28 };
  if (!byId(ui.selected)) ui.selected = byId(28)?.id ?? data.trophies[0]?.id;
  const views = [...document.querySelectorAll('[data-view]')];

  function renderAll() {
    renderTallies(data, state);
    renderList($('trophy-list'), data, state, ui);
    renderDetail($('trophy-detail'), byId(ui.selected), state);
    renderNextUp($('next-up'), data, state);
    renderGuideSources($('guide-sources'), byId(ui.selected));
    renderRoadmap($('roadmap-stages'), data, state, stats);
    renderMissables($('missable-list'), data, state);
    $('btn-spoiler').checked = state.spoiler;
  }
  function persist(next = state) {
    state = next;
    saveState(state, demo);
    renderAll();
  }
  function showView(view) {
    const selected = views.some(button => button.dataset.view === view) ? view : 'tracker';
    for (const button of views) {
      const active = button.dataset.view === selected;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      $(button.getAttribute('aria-controls')).hidden = !active;
    }
  }

  renderAudit($('audit-line'), data, stats);
  renderSources($('sources-matrix'), data, stats);
  renderAll();
  showView(params.get('tab') || 'tracker');

  for (const button of views) button.addEventListener('click', () => showView(button.dataset.view));
  $('kind-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-kind]');
    if (!button) return;
    ui.kind = button.dataset.kind;
    $('kind-filters').querySelectorAll('[data-kind]').forEach(item => item.classList.toggle('active', item === button));
    renderAll();
  });
  $('grade-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-grade]');
    if (!button) return;
    const grade = button.dataset.grade;
    ui.grades.has(grade) ? ui.grades.delete(grade) : ui.grades.add(grade);
    button.classList.toggle('active', ui.grades.has(grade));
    renderAll();
  });
  $('search').addEventListener('input', event => { ui.search = event.target.value; renderAll(); });
  $('filter-hide-earned').addEventListener('change', event => { ui.hideEarned = event.target.checked; renderAll(); });
  $('btn-spoiler').addEventListener('change', event => persist({ ...state, spoiler: event.target.checked }));
  $('trophy-list').addEventListener('click', event => {
    const box = event.target.closest('input[data-action="toggle-earned"]');
    if (box) {
      event.stopPropagation();
      persist(toggleEarned(state, Number(box.dataset.id)));
      return;
    }
    const row = event.target.closest('.trophy-card');
    if (row) { ui.selected = Number(row.dataset.id); renderAll(); }
  });
  $('trophy-detail').addEventListener('click', event => {
    const earned = event.target.closest('[data-action="toggle-earned"]');
    const counter = event.target.closest('[data-count]');
    if (earned) persist(toggleEarned(state, Number(earned.dataset.id)));
    else if (counter) {
      const t = byId(ui.selected);
      const count = state.counts[t.id] || 0;
      persist(setCount(state, t.id, count + Number(counter.dataset.count)));
    }
  });
  for (const id of ['next-up', 'roadmap-stages']) $(id).addEventListener('click', event => {
    const target = event.target.closest('[data-id]');
    if (!target || !byId(target.dataset.id)) return;
    ui.selected = Number(target.dataset.id);
    showView('tracker');
    renderAll();
  });
  $('btn-export').addEventListener('click', () => exportJSON(state));
  $('btn-import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = importJSON(await file.text());
      if (imported) persist(imported);
      else alert('Invalid progress file.');
    } catch { alert('Invalid progress file.'); }
    finally { event.target.value = ''; }
  });
  $('btn-reset').addEventListener('click', () => {
    if (confirm('Reset trophy progress?')) persist(resetState(demo));
  });
}

boot().catch(error => { $('trophy-list').textContent = error.message || 'Could not load the trophy guide.'; });
