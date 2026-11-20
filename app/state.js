export const STORAGE_KEY = 'leonida-trophy-guide-v3';
export const DEMO_KEY = 'leonida-trophy-guide-v3-demo';

const emptyState = () => ({ earned: [], counts: {}, spoiler: true });

function normalizeState(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.earned)) return null;
  const earned = [...new Set(value.earned.map(Number).filter(id => Number.isSafeInteger(id) && id > 0))];
  const counts = {};
  if (value.counts && typeof value.counts === 'object' && !Array.isArray(value.counts)) {
    for (const [id, count] of Object.entries(value.counts)) {
      const key = Number(id);
      const number = Number(count);
      if (Number.isSafeInteger(key) && key > 0 && Number.isFinite(number) && number >= 0) counts[key] = Math.floor(number);
    }
  }
  return { earned, counts, spoiler: typeof value.spoiler === 'boolean' ? value.spoiler : true };
}

export function demoSeed() {
  return { earned: [2, 3, 4, 5, 8, 20, 21, 22, 25, 26, 44, 54], counts: { 15: 96, 17: 27, 28: 6, 31: 34, 35: 41, 48: 120 }, spoiler: true };
}

export function loadState(demo = false) {
  try {
    const value = localStorage.getItem(demo ? DEMO_KEY : STORAGE_KEY);
    return value === null ? emptyState() : normalizeState(JSON.parse(value)) || emptyState();
  } catch { return emptyState(); }
}

export function saveState(state, demo = false) {
  const valid = normalizeState(state) || emptyState();
  try { localStorage.setItem(demo ? DEMO_KEY : STORAGE_KEY, JSON.stringify(valid)); } catch { /* Keep session progress. */ }
}

export function toggleEarned(state, id) {
  const earned = new Set(state.earned);
  earned.has(id) ? earned.delete(id) : earned.add(id);
  return { ...state, earned: [...earned] };
}

export function setCount(state, id, n, targetCount = Number.MAX_SAFE_INTEGER) {
  const counts = { ...state.counts, [id]: Math.min(targetCount, Math.max(0, Math.floor(Number(n) || 0))) };
  return { ...state, counts };
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(normalizeState(state) || emptyState(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importJSON(text) {
  try { return normalizeState(JSON.parse(text)); } catch { return null; }
}

export function resetState(demo = false) {
  try { localStorage.removeItem(demo ? DEMO_KEY : STORAGE_KEY); } catch { /* Session state resets in the caller. */ }
  return emptyState();
}
