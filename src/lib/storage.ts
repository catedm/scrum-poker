const PREFIX = 'codesignal-practice';

export function userCodeKey(problemId: string, levelId: string) {
  return `${PREFIX}:code:${problemId}:${levelId}`;
}

export function progressKey(problemId: string) {
  return `${PREFIX}:progress:${problemId}`;
}

export function timerKey(problemId: string) {
  return `${PREFIX}:timer:${problemId}`;
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
