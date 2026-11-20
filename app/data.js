export const STAGE_NAMES = [
  'Prologue & Chapter 1', 'Chapters 2–4', 'Story Missions & the Open World',
  'Strangers & Side Stories', 'Collectibles & the Map', 'Activities & Skill', 'Finale, 100% & the Platinum'
];
export const KIND_LABELS = { platinum: 'Platinum', story: 'Story', collectibles: 'Collectibles', activities: 'Activities' };
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export async function loadTrophies() {
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error('Could not load the trophy list.');
  return response.json();
}

export function auditStats(trophies) {
  const byGrade = Object.fromEntries(GRADE_ORDER.map(grade => [grade, trophies.filter(t => t.grade === grade).length]));
  return {
    total: trophies.length, byGrade,
    citedSteps: trophies.reduce((sum, t) => sum + t.steps.filter(step => step.includes('[')).length, 0),
    guidesCiting: trophies.filter(t => t.sources.length >= 1).length,
    twoPlus: trophies.filter(t => t.sources.length >= 2).length,
    missableCount: trophies.filter(t => t.missable).length
  };
}

export function sourceMatrix(data) {
  return data.sources.map(source => ({
    ...source,
    guides: data.trophies.filter(t => t.sources.some(item => item.startsWith(`${source.key} — `))).length,
    steps: data.trophies.reduce((sum, t) => sum + t.steps.filter(step => step.includes(`[${source.key}]`)).length, 0)
  }));
}
