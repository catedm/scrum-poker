export type TestDefinition = {
  name: string;
  run: (api: {
    exports: Record<string, unknown>;
    expect: ExpectFactory;
    helpers: TestHelpers;
  }) => void | Promise<void>;
};

export type TestGroup = {
  name: string;
  tests: TestDefinition[];
};

export type LevelConfig = {
  id: string;
  title: string;
  instructionsMd: string;
  changesMd: string[];
  starterCode: string;
  tests: TestGroup[];
};

export type ProblemConfig = {
  id: string;
  title: string;
  description: string;
  levels: LevelConfig[];
};

export type AssertionMatcher = {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toThrow(): void;
};

export type ExpectFactory = (actual: unknown) => AssertionMatcher;

export type TestHelpers = {
  log: (...args: unknown[]) => void;
};

export type TestResult = {
  name: string;
  status: 'pass' | 'fail';
  error?: string;
  durationMs: number;
};

export type GroupResult = {
  name: string;
  tests: TestResult[];
};

export type RunnerOutput = {
  groups: GroupResult[];
  logs: string[];
  runtimeError?: string;
  durationMs: number;
  passed: boolean;
};
