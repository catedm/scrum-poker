import type { TestDefinition, TestGroup } from '../types';

type BuilderState = { groups: TestGroup[]; activeGroup: TestGroup | null };

export function createTestSuite(builder: (api: {
  describe: (name: string, fn: () => void) => void;
  it: (name: string, run: TestDefinition['run']) => void;
}) => void): TestGroup[] {
  const state: BuilderState = { groups: [], activeGroup: null };

  const describe = (name: string, fn: () => void) => {
    const previous = state.activeGroup;
    const group: TestGroup = { name, tests: [] };
    state.activeGroup = group;
    fn();
    state.groups.push(group);
    state.activeGroup = previous;
  };

  const it = (name: string, run: TestDefinition['run']) => {
    if (!state.activeGroup) {
      throw new Error('it() must be called inside describe().');
    }
    state.activeGroup.tests.push({ name, run });
  };

  builder({ describe, it });
  return state.groups;
}
