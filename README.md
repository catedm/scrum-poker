# Local CodeSignal-Style Practice Environment

Browser-run coding practice app with locked levels, Monaco IDE, markdown instructions, timer, and in-browser test execution.

## Stack
- Vite + React + TypeScript
- Monaco Editor (`@monaco-editor/react`)
- Lightweight in-browser test runner with `describe/it/expect`

## Run locally
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```

## Features
- Split-pane layout (instructions left, IDE + output right)
- Top bar with problem selector, level selector, timer controls
- Locked levels: level N unlocks only after level N-1 passes
- Per-problem + per-level code persistence in `localStorage`
- Pass state persistence in `localStorage`
- Timer persistence per problem
- Test output panel with pass/fail details and runtime errors

## Execution model
- User writes TypeScript code exporting functions (`export function ...`).
- Code is transpiled in-browser with TypeScript `transpileModule`.
- Compiled code is evaluated in an isolated function scope per test run.
- Basic global restrictions are applied (`window`, `document`, `fetch` undefined inside execution wrapper).
- Tests run against the freshly evaluated exports each run (no stale module state).

## Problem/Level authoring
All configurable content lives in `src/problems/*.ts`.

Core types (`src/types.ts`):
- `ProblemConfig`
- `LevelConfig`
- `TestGroup` and `TestDefinition`

### Add a new problem
1. Create `src/problems/myProblem.ts`
2. Export a `ProblemConfig`
3. Register it in `src/problems/index.ts`

### Add levels/tests
Each level has:
- `instructionsMd` (markdown string)
- `changesMd` (bullet list data)
- `starterCode` (string)
- `tests` (`TestGroup[]`)

Use helper DSL (`src/lib/testDsl.ts`):
```ts
const tests = createTestSuite(({ describe, it }) => {
  describe('My Group', () => {
    it('does something', ({ exports, expect }) => {
      const fn = exports.solve as ((n: number) => number) | undefined;
      if (!fn) throw new Error('Expected export: solve');
      expect(fn(2)).toBe(4);
    });
  });
});
```

### Expect API
- `expect(actual).toBe(value)`
- `expect(actual).toEqual(value)`
- `expect(fn).toThrow()`

Async tests are supported (return a Promise from `it` callback).

## Sample problems included
1. **Container DB** (3 levels): set/get, delete, scan sorted
2. **Portfolio table helpers** (2 levels): compute total, top gainers
