export const STAGE_NAMES = [
  'Prologue & Chapter 1', 'Chapters 2–4', 'Story Missions & the Open World',
  'Strangers & Side Stories', 'Collectibles & the Map', 'Activities & Skill',
  'Finale, 100% & the Platinum'
];
export const KIND_LABELS = { platinum: 'Platinum', story: 'Story', collectibles: 'Collectibles', activities: 'Activities' };
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const targetCounts = new Map();

export async function loadTrophies() {
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error('Could not load the trophy list.');
  const data = await response.json();
  targetCounts.clear();
  for (const trophy of data.trophies) targetCounts.set(trophy.id, trophy.targetCount || 0);
  return data;
}

export function stageHours(trophies) {
  return Array.from({ length: STAGE_NAMES.length }, (_, i) => {
    const minutes = trophies.filter(t => t.stage === i + 1).reduce((sum, t) => sum + (t.timeMin || 0), 0);
    return Math.round(minutes / 60 * 10) / 10;
  });
}

export function totalHours(trophies) {
  return Math.round(stageHours(trophies).reduce((sum, hours) => sum + hours, 0) * 10) / 10;
}

export function auditStats(trophies) {
  const byGrade = Object.fromEntries(GRADE_ORDER.map(grade => [grade, { total: trophies.filter(t => t.grade === grade).length }]));
  return {
    total: trophies.length, byGrade,
    citedSteps: trophies.reduce((sum, t) => sum + t.steps.filter(step => step.includes('[')).length, 0),
    guidesCiting: trophies.filter(t => t.sources.length >= 1).length,
    twoPlus: trophies.filter(t => t.sources.length >= 2).length,
    missableCount: trophies.filter(t => t.missable).length,
    totalHours: totalHours(trophies),
    withTime: trophies.filter(t => typeof t.time === 'string' && t.time.length > 0).length,
    withDifficulty: trophies.filter(t => t.difficulty).length,
    difficultyCounts: {
      Easy: trophies.filter(t => t.difficulty === 'Easy').length,
      Moderate: trophies.filter(t => t.difficulty === 'Moderate').length,
      Hard: trophies.filter(t => t.difficulty === 'Hard').length
    }
  };
}

export function sourceMatrix(data) {
  return data.sources.map(({ key, name, detail }) => ({
    key, name, detail,
    guides: data.trophies.filter(t => t.sources.some(source => source.startsWith(`${key} — `))).length,
    steps: data.trophies.reduce((sum, t) => sum + t.steps.filter(step => step.includes(`[${key}]`)).length, 0)
  }));
}
