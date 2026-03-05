import type { RunnerOutput } from '../types';

type Props = {
  output: RunnerOutput | null;
};

export default function OutputPanel({ output }: Props) {
  if (!output) return <div className="output-panel">Run tests to see results.</div>;

  return (
    <div className="output-panel">
      <div className="output-summary">
        <strong>{output.passed ? '✅ Passed' : '❌ Failed'}</strong>
        <span>{output.durationMs.toFixed(1)} ms</span>
      </div>

      {output.runtimeError && <pre className="runtime-error">Runtime error: {output.runtimeError}</pre>}

      {output.groups.map((group) => (
        <div key={group.name} className="test-group">
          <div className="test-group-title">{group.name}</div>
          {group.tests.map((test) => (
            <div key={test.name} className={`test-row ${test.status}`}>
              <span>
                {test.status === 'pass' ? '✔' : '✖'} {test.name}
              </span>
              <span>{test.durationMs.toFixed(1)} ms</span>
              {test.error ? <pre>{test.error}</pre> : null}
            </div>
          ))}
        </div>
      ))}

      {output.logs.length > 0 && (
        <div>
          <div className="test-group-title">Logs</div>
          <pre>{output.logs.join('\n')}</pre>
        </div>
      )}
    </div>
  );
}
