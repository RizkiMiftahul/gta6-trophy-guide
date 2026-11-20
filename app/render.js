import { STAGES, byStage, missables } from './data.js';

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => entities[char]);

export const HIDDEN_NAME = 'Hidden Trophy';
export const HIDDEN_DESCRIPTION = 'Story trophy — hidden by the spoiler shield until earned.';
export const isSpoilerHidden = (t, earned, shield) => shield && t.kind === 'story' && !earned.has(t.id);

function chips(t, hidden) {
  return `<div class="t-chips">
    <span class="t-chip" data-grade="${esc(t.grade)}">${esc(t.grade)}</span>
    <span class="t-chip">${esc(t.kind)}</span>
    ${!hidden && t.target ? `<span class="t-chip">${esc(t.target)}</span>` : ''}
    ${t.missable ? '<span class="t-chip missable">Missable</span>' : ''}
  </div>`;
}

export function trophyCard(t, earned, spoilerShield) {
  const checked = earned.has(t.id);
  const hidden = isSpoilerHidden(t, earned, spoilerShield);
  const name = esc(hidden ? HIDDEN_NAME : t.name);
  return `<article class="trophy-card${checked ? ' earned' : ''}${hidden ? ' spoiler-hidden' : ''}" data-grade="${esc(t.grade)}" data-id="${esc(t.id)}">
    <input type="checkbox" data-action="toggle-earned" data-id="${esc(t.id)}" aria-label="Mark ${name} earned"${checked ? ' checked' : ''}>
    <div>
      <button type="button" class="t-name" data-action="open-trophy" data-id="${esc(t.id)}"${hidden ? ' style="filter: none"' : ''}>${name}</button>
      <p class="t-description">${esc(hidden ? HIDDEN_DESCRIPTION : t.description)}</p>
      ${chips(t, hidden)}
    </div>
  </article>`;
}

function earnedButton(t, earned) {
  const checked = earned.has(t.id);
  return `<button type="button" class="earned-toggle" data-action="toggle-earned" data-id="${esc(t.id)}" aria-pressed="${checked}">${checked ? '✓ Earned · mark unearned' : 'Mark as earned'}</button>`;
}

export function detailHTML(t, earned, spoilerShield = false) {
  const hidden = isSpoilerHidden(t, earned, spoilerShield);
  return `
    <header class="detail-header">
      <span class="grade-badge" data-grade="${esc(t.grade)}">${esc(t.grade)}</span>
      <h2>${esc(hidden ? HIDDEN_NAME : t.name)}</h2>
      ${chips(t, hidden)}
    </header>
    ${hidden ? `<p class="spoiler-note">${HIDDEN_DESCRIPTION}</p>` : `
      <blockquote class="official-description">${esc(t.description)}</blockquote>
      ${t.missable ? `<div class="missable-banner"><strong>Missable trophy</strong>${esc(t.missableNote)}</div>` : ''}
      <section class="guide-body"><h3>Guide</h3>
        <p>${esc(t.guide)}</p>
        <ol class="guide-steps">${t.steps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>
      </section>
      <section class="sources"><h3>Sources</h3>
        <ul>${t.sources.map(source => `<li>${esc(source)}</li>`).join('')}</ul>
      </section>`}
    ${earnedButton(t, earned)}`;
}

export function roadmapHTML(trophies, earned, spoilerShield = false) {
  return STAGES.map(stage => `<article class="roadmap-stage">
    <span class="stage-number" aria-label="Stage ${stage.n}">${stage.n}</span>
    <h3>${esc(stage.title)}</h3>
    <p>${esc(stage.blurb)}</p>
    <div class="trophy-chips">${byStage(trophies, stage.n).map(t => {
      const name = isSpoilerHidden(t, earned, spoilerShield) ? HIDDEN_NAME : t.name;
      return `<button type="button" class="trophy-chip${t.missable ? ' missable' : ''}" data-grade="${esc(t.grade)}" data-action="open-trophy" data-id="${esc(t.id)}">${esc(name)}${earned.has(t.id) ? ' ✓' : ''}${t.missable ? ' · Missable' : ''}</button>`;
    }).join('')}</div>
  </article>`).join('');
}

export function missablesHTML(trophies, earned, spoilerShield = false) {
  return missables(trophies).map(t => {
    const hidden = isSpoilerHidden(t, earned, spoilerShield);
    return `<article class="missable-card">
      <span class="trophy-number" aria-label="Trophy ${esc(t.id)}">${esc(t.id)}</span>
      <h3>${esc(hidden ? HIDDEN_NAME : t.name)}${earned.has(t.id) ? ' ✓' : ''}</h3>
      <p>${esc(hidden ? HIDDEN_DESCRIPTION : t.missableNote)}</p>
      <button type="button" class="button" data-action="open-trophy" data-id="${esc(t.id)}">Open trophy guide</button>
    </article>`;
  }).join('');
}
