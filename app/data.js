export const STAGES = [
  { n: 1, title: 'Prologue & Chapter 1', blurb: 'Check the opening mission warning before you start and collect the early story trophies.' },
  { n: 2, title: 'Chapters 2–4', blurb: 'Advance through the early chapters and watch for one-time story choices.' },
  { n: 3, title: 'Story Missions & the Open World', blurb: 'Alternate story missions with open world objectives as they become available.' },
  { n: 4, title: 'Strangers & Side Stories', blurb: 'Follow up on stranger encounters and finish the available side stories.' },
  { n: 5, title: 'Collectibles & the Map', blurb: 'Sweep the map by region and track collectible sets as you go.' },
  { n: 6, title: 'Activities & Skill', blurb: 'Finish activity challenges and revisit any events where you still need a better result.' },
  { n: 7, title: 'Finale, 100% & the Platinum', blurb: 'Finish the story and work through your remaining requirements for the platinum.' },
];

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export async function loadTrophies() {
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error('Could not load the trophy list.');
  const { trophies } = await response.json();
  if (!Array.isArray(trophies)) throw new Error('Invalid trophy list.');
  return trophies;
}

export function byStage(trophies, n) {
  return trophies.filter(t => t.stage === n).sort((a, b) => a.id - b.id);
}

export function missables(trophies) {
  return trophies.filter(t => t.missable).sort((a, b) => a.stage - b.stage || a.id - b.id);
}

export function countsByGrade(trophies, earned) {
  const counts = Object.fromEntries(GRADE_ORDER.map(grade => [grade, 0]));
  for (const trophy of trophies) {
    if (earned.has(trophy.id)) counts[trophy.grade]++;
  }
  return counts;
}

export function platinumPath(trophies, earned) {
  const requirements = trophies.filter(t => t.grade !== 'platinum');
  return requirements.length ? requirements.filter(t => earned.has(t.id)).length / requirements.length : 0;
}
