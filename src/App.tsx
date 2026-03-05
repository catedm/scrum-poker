import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import { problems } from './problems';
import type { RunnerOutput } from './types';
import { loadFromStorage, progressKey, saveToStorage, timerKey, userCodeKey } from './lib/storage';
import { runLevelTests } from './lib/runner';
import OutputPanel from './components/OutputPanel';

type TimerState = {
  elapsedMs: number;
  running: boolean;
};

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function App() {
  const [problemId, setProblemId] = useState(problems[0].id);
  const problem = useMemo(() => problems.find((p) => p.id === problemId) ?? problems[0], [problemId]);

  const [passedLevels, setPassedLevels] = useState<Record<string, boolean>>(() =>
    loadFromStorage(progressKey(problem.id), {}),
  );

  const [levelId, setLevelId] = useState(problem.levels[0].id);
  const level = useMemo(() => problem.levels.find((l) => l.id === levelId) ?? problem.levels[0], [problem, levelId]);

  const [code, setCode] = useState<string>(() =>
    loadFromStorage(userCodeKey(problem.id, problem.levels[0].id), problem.levels[0].starterCode),
  );

  const [timer, setTimer] = useState<TimerState>(() => loadFromStorage(timerKey(problem.id), { elapsedMs: 0, running: false }));
  const [levelStartMs, setLevelStartMs] = useState<number>(Date.now());
  const [timePerLevel, setTimePerLevel] = useState<Record<string, number>>({});

  const [output, setOutput] = useState<RunnerOutput | null>(null);

  useEffect(() => {
    setPassedLevels(loadFromStorage(progressKey(problem.id), {}));
    setLevelId(problem.levels[0].id);
    setCode(loadFromStorage(userCodeKey(problem.id, problem.levels[0].id), problem.levels[0].starterCode));
    setTimer(loadFromStorage(timerKey(problem.id), { elapsedMs: 0, running: false }));
    setOutput(null);
    setTimePerLevel({});
    setLevelStartMs(Date.now());
  }, [problem.id]);

  useEffect(() => {
    const nextCode = loadFromStorage(userCodeKey(problem.id, level.id), level.starterCode);
    setCode(nextCode);
    setOutput(null);
    setLevelStartMs(Date.now());
  }, [problem.id, level.id]);

  useEffect(() => {
    saveToStorage(userCodeKey(problem.id, level.id), code);
  }, [problem.id, level.id, code]);

  useEffect(() => {
    saveToStorage(progressKey(problem.id), passedLevels);
  }, [problem.id, passedLevels]);

  useEffect(() => {
    saveToStorage(timerKey(problem.id), timer);
  }, [problem.id, timer]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setTimer((prev) => ({ ...prev, elapsedMs: prev.elapsedMs + 1000 }));
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const levelIndex = problem.levels.findIndex((l) => l.id === level.id);

  const unlockedLevels = problem.levels.map((l, i) => {
    if (i === 0) return true;
    const prev = problem.levels[i - 1];
    return Boolean(passedLevels[prev.id]);
  });

  async function onRunTests() {
    const result = await runLevelTests(code, level.tests);
    setOutput(result);
    if (result.passed) {
      setPassedLevels((prev) => ({ ...prev, [level.id]: true }));
      setTimePerLevel((prev) => ({ ...prev, [level.id]: (prev[level.id] ?? 0) + (Date.now() - levelStartMs) / 1000 }));
    }
  }

  function selectLevel(nextLevelId: string) {
    const idx = problem.levels.findIndex((l) => l.id === nextLevelId);
    if (!unlockedLevels[idx]) return;
    setLevelId(nextLevelId);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <select value={problem.id} onChange={(e) => setProblemId(e.target.value)}>
          {problems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        <select value={level.id} onChange={(e) => selectLevel(e.target.value)}>
          {problem.levels.map((l, i) => (
            <option key={l.id} value={l.id} disabled={!unlockedLevels[i]}>
              {l.title} {!unlockedLevels[i] ? '🔒' : ''}
            </option>
          ))}
        </select>

        <div className="timer">⏱ {formatMs(timer.elapsedMs)}</div>
        <button onClick={() => setTimer((prev) => ({ ...prev, running: !prev.running }))}>
          {timer.running ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => setTimer({ elapsedMs: 0, running: false })}>Reset</button>

        <button onClick={() => setCode(level.starterCode)}>Reset to Starter Code</button>
        <button className="primary" onClick={onRunTests}>
          Run Tests
        </button>
      </header>

      <div className="content-split">
        <aside className="left-pane">
          <h2>{problem.title}</h2>
          <p>{problem.description}</p>

          <div className="level-list">
            {problem.levels.map((l, i) => {
              const unlocked = unlockedLevels[i];
              const passed = Boolean(passedLevels[l.id]);
              return (
                <button
                  key={l.id}
                  onClick={() => selectLevel(l.id)}
                  disabled={!unlocked}
                  className={l.id === level.id ? 'active' : ''}
                >
                  {l.title} — {passed ? 'Passed' : unlocked ? 'Unlocked' : 'Locked'}
                </button>
              );
            })}
          </div>

          <section className="instructions" dangerouslySetInnerHTML={{ __html: marked.parse(level.instructionsMd) }} />

          <section>
            <h3>Changes in this level</h3>
            <ul>
              {level.changesMd.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Time spent per level</h3>
            <ul>
              {problem.levels.map((l) => (
                <li key={l.id}>
                  {l.title}: {Math.round(timePerLevel[l.id] ?? 0)}s
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="right-pane">
          <Editor
            height="55vh"
            defaultLanguage="typescript"
            language="typescript"
            value={code}
            onChange={(value) => setCode(value ?? '')}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
          <OutputPanel output={output} />
          <div className="hint">Current level: {levelIndex + 1}/{problem.levels.length}</div>
        </main>
      </div>
    </div>
  );
}
