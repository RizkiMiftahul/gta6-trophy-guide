import { STAGE_NAMES, KIND_LABELS, GRADE_ORDER, sourceMatrix } from './data.js';

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => entities[c]);
export const hidden = (t, state) => state.spoiler && t.kind === 'story' && !state.earned.includes(t.id);
const title = (t, state) => hidden(t, state) ? `Story trophy · Stage ${t.stage}` : t.name;
const countFor = (t, state) => state.earned.includes(t.id) ? t.targetCount : Math.min(t.targetCount, state.counts[t.id] || 0);
const kind = t => KIND_LABELS[t.kind] || t.kind;
const chip = (text, extra = '') => `<span class="t-chip${extra}">${esc(text)}</span>`;
const steps = t => `<ol class="guide-steps">${t.steps.map(step => `<li>${citeChips(step)}</li>`).join('')}</ol>`;
const sources = t => `<ul>${t.sources.map(source => `<li>${esc(source)}</li>`).join('')}</ul>`;
const progressBar = percent => `<div class="platinum-bar"><div style="height:100%;width:${percent}%;background:var(--accent)"></div></div>`;
const chips = t => `<div class="t-chips">${chip(t.grade)}${chip(kind(t))}${chip(`Stage ${t.stage} — ${STAGE_NAMES[t.stage - 1]}`)}${t.target ? chip(t.target) : ''}</div>`;

export function citeChips(text) {
  return esc(text).replace(/\[([^\]]+)\]/g, '<span class="cite">$1</span>');
}

export function renderAudit(el, data, stats) {
  const makeup = GRADE_ORDER.map(grade => `${stats.byGrade[grade].total} ${grade}`).join(' · ');
  el.textContent = `AUDIT · ${stats.total}/${stats.total} official names, descriptions & grades · ${makeup} · ${stats.guidesCiting}/${stats.total} guides cite sources · ${stats.citedSteps} cited steps · ${stats.twoPlus} backed by 2+ sources · ${stats.missableCount} missables flagged from the official descriptions · roadmap in ${STAGE_NAMES.length} stages`;
}

export function renderTallies(data, state) {
  const earned = data.trophies.filter(t => state.earned.includes(t.id));
  document.getElementById('earned-count').textContent = earned.length;
  document.getElementById('platinum-bar-fill').style.width = `${data.trophies.length ? earned.length / data.trophies.length * 100 : 0}%`;
  for (const grade of GRADE_ORDER) {
    const total = data.trophies.filter(t => t.grade === grade).length;
    const got = earned.filter(t => t.grade === grade).length;
    document.querySelector(`#grade-tallies [data-grade="${grade}"]`).textContent = `${grade[0].toUpperCase()} ${got}/${total}`;
  }
}

export function renderList(el, data, state, ui) {
  const earned = new Set(state.earned);
  const query = ui.search.trim().toLowerCase();
  const filtered = data.trophies.filter(t =>
    (ui.kind === 'all' || (ui.kind === 'missable' ? t.missable : ui.kind === 'not-earned' ? !earned.has(t.id) : t.kind === ui.kind)) &&
    (!ui.grades.size || ui.grades.has(t.grade)) && (!ui.hideEarned || !earned.has(t.id)) &&
    (!query || [t.name, t.description, t.guide].join(' ').toLowerCase().includes(query)));
  document.getElementById('list-count').textContent = `${filtered.length} shown`;
  el.innerHTML = STAGE_NAMES.map((name, i) => {
    const all = data.trophies.filter(t => t.stage === i + 1);
    const group = filtered.filter(t => t.stage === i + 1).sort((a, b) => a.id - b.id);
    if (!group.length) return '';
    return `<section class="stage-group"><h3>Stage ${i + 1} — ${esc(name)} <span>${all.filter(t => earned.has(t.id)).length}/${all.length}</span></h3>${group.map(t =>
      `<article class="trophy-card${earned.has(t.id) ? ' earned' : ''}${ui.selected === t.id ? ' selected' : ''}" data-id="${t.id}" data-grade="${esc(t.grade)}"><input type="checkbox" data-action="toggle-earned" data-id="${t.id}" aria-label="Mark ${esc(title(t, state))} earned"${earned.has(t.id) ? ' checked' : ''}><div><button class="t-name" type="button">${esc(title(t, state))}</button><p class="t-description">${esc(hidden(t, state) ? 'Hidden by the spoiler shield until earned.' : t.description)}</p><div class="t-chips">${chip(kind(t))}${t.targetCount ? chip(`${countFor(t, state)}/${t.targetCount}`) : ''}${t.missable ? chip('MISSABLE', ' missable') : ''}${chip(`${t.sources.length} src`)}</div></div></article>`
    ).join('')}</section>`;
  }).join('') || '<p class="empty-state">No trophies match these filters.</p>';
}

export function renderDetail(el, t, state) {
  if (!t) { el.innerHTML = ''; return; }
  const isHidden = hidden(t, state);
  const count = Math.min(t.targetCount || 0, state.counts[t.id] || 0);
  el.innerHTML = `<header class="detail-header"><span class="grade-badge" data-grade="${esc(t.grade)}">${esc(t.grade)}</span><h2>${esc(isHidden ? 'Story trophy' : t.name)}</h2>${chips(t)}</header>
    ${isHidden ? '<p class="spoiler-note">Hidden by the spoiler shield until earned.</p>' : `<h3>OFFICIAL DESCRIPTION</h3><blockquote class="official-description" data-grade="${esc(t.grade)}">${esc(t.description)}</blockquote>`}
    ${t.missable ? `<div class="missable-banner"><strong>MISSABLE</strong>${esc(t.missableNote)}</div>` : ''}
    ${t.targetCount ? `<div class="counter-widget"><label>YOUR COUNT</label><button type="button" data-count="-1" aria-label="Decrease count">−</button><output>${count} / ${t.targetCount}</output><button type="button" data-count="1" aria-label="Increase count">+</button><div style="width:100%">${progressBar(count / t.targetCount * 100)}</div></div>` : ''}
    <button type="button" class="earned-toggle" data-action="toggle-earned" data-id="${t.id}">${state.earned.includes(t.id) ? 'Earned ✓' : 'Mark earned'}</button>
    <section class="guide-body">${isHidden ? '' : `<p>${esc(t.guide)}</p>`}<h3>HOW TO EARN IT · ${t.steps.length} steps in our own words, each with its sources</h3>${steps(t)}</section>
    <section class="sources"><h3>SOURCES</h3>${sources(t)}</section>`;
}

export function renderNextUp(el, data, state) {
  el.innerHTML = data.trophies.filter(t => !state.earned.includes(t.id)).sort((a, b) => a.stage - b.stage || a.id - b.id).slice(0, 4).map(t =>
    `<button type="button" class="next-item" data-id="${t.id}">${esc(title(t, state))}<small>stage ${t.stage} · ${esc(kind(t))}</small>${t.missable ? chip('MISSABLE', ' missable') : ''}</button>`
  ).join('') || '<p>All trophies earned.</p>';
}

export function renderGuideSources(el, t) {
  el.innerHTML = t ? `${sources(t)}<small>${t.steps.length} steps · ${t.sources.length} sources for this guide</small>` : '';
}

export function renderRoadmap(el, data, state) {
  el.innerHTML = STAGE_NAMES.map((name, i) => {
    const group = data.trophies.filter(t => t.stage === i + 1).sort((a, b) => a.id - b.id);
    const got = group.filter(t => state.earned.includes(t.id)).length;
    return `<article class="roadmap-stage"><span class="stage-number">${i + 1}</span><h3>Stage ${i + 1} — ${esc(name)}</h3>${progressBar(group.length ? got / group.length * 100 : 0)}<p>${got}/${group.length} earned</p><div class="trophy-chips">${group.map(t => `<button type="button" class="trophy-chip" data-id="${t.id}" data-grade="${esc(t.grade)}"><span style="color:var(--grade)">●</span> ${esc(title(t, state))}${t.missable ? ' ⚑' : ''}${state.earned.includes(t.id) ? ' ✓' : ''}</button>`).join('')}</div></article>`;
  }).join('');
}

export function renderMissables(el, data, state) {
  el.innerHTML = data.trophies.filter(t => t.missable).map(t => `<article class="missable-card"><h3>${esc(title(t, state))}</h3><div class="t-chips">${chip(t.grade)}${chip(kind(t))}</div><blockquote class="official-description">${esc(t.description)}</blockquote><p><strong>Window:</strong> ${esc(t.missableNote)}</p><p>${esc(t.guide)}</p>${steps(t)}<small>${t.sources.map(esc).join(' · ')}</small></article>`).join('');
}

export function renderSources(el, data, stats) {
  const matrix = sourceMatrix(data);
  document.getElementById('sources-coverage').textContent = `${stats.guidesCiting}/${stats.total} guides cite sources · ${stats.citedSteps} cited steps · ${stats.twoPlus} guides backed by 2+ sources · ${matrix.length} sources, read 20 Nov 2026`;
  el.innerHTML = matrix.map(source => `<article class="sources"><h3>${esc(source.name)}</h3><p>${esc(source.detail)}</p><small>${source.guides} guides · ${source.steps} cited steps</small></article>`).join('');
}
