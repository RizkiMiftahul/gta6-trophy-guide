import { targetCounts } from './data.js';

export const STORAGE_KEY = 'leonida-trophy-guide-v3';
export const DEMO_KEY = 'leonida-trophy-guide-v3-demo';
const emptyState = () => ({ earned: [], counts: {}, spoiler: true });

function validateState(value) {
  if (!value || !Array.isArray(value.earned) || !value.counts ||
      typeof value.counts !== 'object' || Array.isArray(value.counts) ||
      typeof value.spoiler !== 'boolean') return null;
  const validId = id => Number.isSafeInteger(id) && id > 0;
  if (!value.earned.every(validId)) return null;
  const counts = {};
  for (const [id, count] of Object.entries(value.counts)) {
    if (!validId(Number(id)) || !Number.isSafeInteger(count) || count < 0) return null;
    counts[id] = Math.min(targetCounts.get(Number(id)) ?? Number.MAX_SAFE_INTEGER, count);
  }
  return { earned: [...new Set(value.earned)], counts, spoiler: value.spoiler };
}

export function demoSeed() {
  return { earned: [2, 3, 4, 5, 8, 20, 21, 22, 25, 26, 44, 54], counts: {15: 96, 17: 27, 28: 6, 31: 34, 35: 41, 48: 120}, spoiler: true };
}

export function loadState(demo = false) {
  try { return importJSON(localStorage.getItem(demo ? DEMO_KEY : STORAGE_KEY)) || emptyState(); }
  catch { return emptyState(); }
}

export function saveState(state, demo = false) {
  try { localStorage.setItem(demo ? DEMO_KEY : STORAGE_KEY, JSON.stringify(validateState(state) || emptyState())); }
  catch { /* Retain progress in memory when storage is unavailable. */ }
}

export function toggleEarned(state, id) {
  const earned = new Set(state.earned);
  earned.has(id) ? earned.delete(id) : earned.add(id);
  return { ...state, earned: [...earned] };
}

export function setCount(state, id, n, targetCount = targetCounts.get(id) || 0) {
  const count = Math.min(targetCount, Math.max(0, Math.floor(Number(n) || 0)));
  return { ...state, counts: { ...state.counts, [id]: count } };
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(validateState(state) || emptyState(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob;
}

export function importJSON(text) {
  try { return validateState(JSON.parse(text)); } catch { return null; }
}

export function resetState(demo = false) {
  try { localStorage.removeItem(demo ? DEMO_KEY : STORAGE_KEY); }
  catch { /* The caller also replaces the session state. */ }
  return emptyState();
}

export function hoursEarned(trophies, state) {
  const minutes = trophies.filter(t => state.earned.includes(t.id)).reduce((sum, t) => sum + (t.timeMin || 0), 0);
  return (minutes / 60).toFixed(1);
}
