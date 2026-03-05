import ts from 'typescript';
import type { ExpectFactory, RunnerOutput, TestGroup } from '../types';

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (!a || !b || typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => deepEqual(aObj[k], bObj[k]));
}

const expectFactory: ExpectFactory = (actual) => ({
  toBe(expected) {
    if (!Object.is(actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    }
  },
  toEqual(expected) {
    if (!deepEqual(actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`);
    }
  },
  toThrow() {
    if (typeof actual !== 'function') {
      throw new Error('toThrow expects a function');
    }
    let threw = false;
    try {
      (actual as () => unknown)();
    } catch {
      threw = true;
    }
    if (!threw) {
      throw new Error('Expected function to throw, but it did not.');
    }
  },
});

function compileUserCode(code: string): string {
  const wrapped = `${code}\n;return module.exports;`;
  const result = ts.transpileModule(wrapped, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      esModuleInterop: true,
    },
  });
  return result.outputText;
}

function evaluateUserCode(compiledJs: string): Record<string, unknown> {
  const module = { exports: {} as Record<string, unknown> };
  const guarded = `
    "use strict";
    const window = undefined;
    const document = undefined;
    const fetch = undefined;
    const XMLHttpRequest = undefined;
    const WebSocket = undefined;
    const globalThis = undefined;
    ${compiledJs}
  `;

  // eslint-disable-next-line no-new-func
  const fn = new Function('module', 'exports', guarded);
  fn(module, module.exports);
  return module.exports;
}

export async function runLevelTests(code: string, groups: TestGroup[]): Promise<RunnerOutput> {
  const runStart = performance.now();
  const logs: string[] = [];

  try {
    const compiled = compileUserCode(code);
    const exports = evaluateUserCode(compiled);
    const results: RunnerOutput['groups'] = [];

    for (const group of groups) {
      const groupResult = { name: group.name, tests: [] as RunnerOutput['groups'][number]['tests'] };
      for (const test of group.tests) {
        const start = performance.now();
        try {
          await test.run({
            exports,
            expect: expectFactory,
            helpers: { log: (...args) => logs.push(args.map((a) => String(a)).join(' ')) },
          });
          groupResult.tests.push({ name: test.name, status: 'pass', durationMs: performance.now() - start });
        } catch (error) {
          groupResult.tests.push({
            name: test.name,
            status: 'fail',
            durationMs: performance.now() - start,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      results.push(groupResult);
    }

    const passed = results.every((group) => group.tests.every((test) => test.status === 'pass'));
    return {
      groups: results,
      logs,
      durationMs: performance.now() - runStart,
      passed,
    };
  } catch (error) {
    return {
      groups: [],
      logs,
      passed: false,
      durationMs: performance.now() - runStart,
      runtimeError: error instanceof Error ? error.message : String(error),
    };
  }
}
