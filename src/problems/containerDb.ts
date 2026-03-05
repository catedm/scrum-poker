import type { ProblemConfig } from '../types';
import { createTestSuite } from '../lib/testDsl';

const level1Tests = createTestSuite(({ describe, it }) => {
  describe('ContainerDB basics', () => {
    it('stores and retrieves values', ({ exports, expect }) => {
      const createContainerDb = exports.createContainerDb as (() => {
        set: (k: string, v: string) => void;
        get: (k: string) => string | null;
      }) | undefined;

      if (!createContainerDb) throw new Error('Expected export: createContainerDb');
      const db = createContainerDb();
      db.set('foo', 'bar');
      expect(db.get('foo')).toBe('bar');
    });

    it('returns null for missing keys', ({ exports, expect }) => {
      const createContainerDb = exports.createContainerDb as (() => { get: (k: string) => string | null }) | undefined;
      if (!createContainerDb) throw new Error('Expected export: createContainerDb');
      const db = createContainerDb();
      expect(db.get('nope')).toBe(null);
    });
  });
});

const level2Tests = createTestSuite(({ describe, it }) => {
  describe('Delete behavior', () => {
    it('delete removes key and returns true', ({ exports, expect }) => {
      const createContainerDb = exports.createContainerDb as (() => {
        set: (k: string, v: string) => void;
        get: (k: string) => string | null;
        delete: (k: string) => boolean;
      }) | undefined;
      if (!createContainerDb) throw new Error('Expected export: createContainerDb');
      const db = createContainerDb();
      db.set('a', '1');
      expect(db.delete('a')).toBe(true);
      expect(db.get('a')).toBe(null);
    });

    it('delete missing key returns false', ({ exports, expect }) => {
      const createContainerDb = exports.createContainerDb as (() => { delete: (k: string) => boolean }) | undefined;
      if (!createContainerDb) throw new Error('Expected export: createContainerDb');
      expect(createContainerDb().delete('missing')).toBe(false);
    });
  });
});

const level3Tests = createTestSuite(({ describe, it }) => {
  describe('Scan behavior', () => {
    it('returns sorted key/value pairs by key', ({ exports, expect }) => {
      const createContainerDb = exports.createContainerDb as (() => {
        set: (k: string, v: string) => void;
        scan: () => Array<[string, string]>;
      }) | undefined;

      if (!createContainerDb) throw new Error('Expected export: createContainerDb');
      const db = createContainerDb();
      db.set('b', '2');
      db.set('a', '1');
      db.set('c', '3');
      expect(db.scan()).toEqual([
        ['a', '1'],
        ['b', '2'],
        ['c', '3'],
      ]);
    });
  });
});

export const containerDbProblem: ProblemConfig = {
  id: 'container-db',
  title: 'Container DB',
  description: 'Build an in-memory key-value container in progressive levels.',
  levels: [
    {
      id: 'l1-basic',
      title: 'Level 1: set/get',
      instructionsMd: `
Implement **createContainerDb**.

Requirements:
- \'set(key, value)\' stores string values.
- \'get(key)\' returns the value or \'null\' if key does not exist.
`,
      changesMd: ['Introduce the DB factory and support basic set/get operations.'],
      starterCode: `
export function createContainerDb() {
  const data: Record<string, string> = {};

  return {
    set(key: string, value: string) {
      // TODO
    },
    get(key: string): string | null {
      // TODO
      return null;
    },
  };
}
`,
      tests: level1Tests,
    },
    {
      id: 'l2-delete',
      title: 'Level 2: delete',
      instructionsMd: `
Enhance **createContainerDb** by adding:
- \'delete(key)\' => returns \'true\' if the key existed and was removed; otherwise \'false\'.
`,
      changesMd: ['Add delete operation with boolean return semantics.'],
      starterCode: `
export function createContainerDb() {
  const data: Record<string, string> = {};

  return {
    set(key: string, value: string) {
      data[key] = value;
    },
    get(key: string): string | null {
      return key in data ? data[key] : null;
    },
    delete(key: string): boolean {
      // TODO
      return false;
    },
  };
}
`,
      tests: level2Tests,
    },
    {
      id: 'l3-scan',
      title: 'Level 3: scan sorted',
      instructionsMd: `
Add scanning support:
- \'scan()\' returns all key-value pairs as tuple array: \'[key, value][]\'.
- Sorted lexicographically by key.
`,
      changesMd: ['Introduce scan() with deterministic sorted output.'],
      starterCode: `
export function createContainerDb() {
  const data: Record<string, string> = {};

  return {
    set(key: string, value: string) {
      data[key] = value;
    },
    get(key: string): string | null {
      return key in data ? data[key] : null;
    },
    delete(key: string): boolean {
      if (!(key in data)) return false;
      delete data[key];
      return true;
    },
    scan(): Array<[string, string]> {
      // TODO
      return [];
    },
  };
}
`,
      tests: level3Tests,
    },
  ],
};
