export const STORAGE_KEY = 'leonida-trophy-guide-v1';

function parseProgress(json) {
  const data = JSON.parse(json);
  const ids = Array.isArray(data) ? data : data?.earned;
  if (!Array.isArray(ids)) throw new Error('Expected an array of earned trophy IDs.');
  return new Set(ids.map(id => {
    const number = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id;
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid trophy ID.');
    return number;
  }));
}

export function loadProgress() {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earned] }));
  } catch {
    // Progress remains available for this session and can still be exported.
  }
}

export function toggleEarned(earned, id) {
  if (!earned.delete(id)) earned.add(id);
  return earned;
}

export function exportProgress(earned) {
  const blob = new Blob([JSON.stringify({ earned: [...earned] }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importProgress(file) {
  return parseProgress(await file.text());
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The caller still clears the current session.
  }
}

export function seedDemoProgress() {
  return new Set([2, 3, 4, 8, 44, 16, 21, 35, 53]);
}
