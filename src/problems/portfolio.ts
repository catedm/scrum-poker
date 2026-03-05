import type { ProblemConfig } from '../types';
import { createTestSuite } from '../lib/testDsl';

const level1Tests = createTestSuite(({ describe, it }) => {
  describe('Portfolio total value', () => {
    it('sums quantity * price', ({ exports, expect }) => {
      const computeTotal = exports.computeTotal as ((rows: Array<{ qty: number; price: number }>) => number) | undefined;
      if (!computeTotal) throw new Error('Expected export: computeTotal');
      expect(computeTotal([{ qty: 2, price: 10 }, { qty: 3, price: 5 }])).toBe(35);
    });
  });
});

const level2Tests = createTestSuite(({ describe, it }) => {
  describe('Top gainers helper', () => {
    it('returns symbols sorted by descending change', ({ exports, expect }) => {
      const topGainers = exports.topGainers as
        | ((rows: Array<{ symbol: string; changePct: number }>, take?: number) => string[])
        | undefined;
      if (!topGainers) throw new Error('Expected export: topGainers');
      const result = topGainers(
        [
          { symbol: 'AAPL', changePct: 1.1 },
          { symbol: 'MSFT', changePct: 2.2 },
          { symbol: 'TSLA', changePct: 0.1 },
        ],
        2,
      );
      expect(result).toEqual(['MSFT', 'AAPL']);
    });
  });
});

export const portfolioProblem: ProblemConfig = {
  id: 'portfolio-table',
  title: 'Portfolio table helpers',
  description: 'Implement utility functions used by a hypothetical portfolio UI.',
  levels: [
    {
      id: 'p1-total',
      title: 'Level 1: total value',
      instructionsMd: `
Implement \`computeTotal(rows)\`.

Each row has:
- \`qty: number\`
- \`price: number\`

Return the total portfolio value.
`,
      changesMd: ['Build total-value aggregation helper for UI summary card.'],
      starterCode: `
export function computeTotal(rows: Array<{ qty: number; price: number }>): number {
  // TODO
  return 0;
}
`,
      tests: level1Tests,
    },
    {
      id: 'p2-gainers',
      title: 'Level 2: top gainers',
      instructionsMd: `
Implement \`topGainers(rows, take = 3)\`.

- Rows have \`symbol\` and \`changePct\`.
- Return symbols sorted by descending \`changePct\`.
- Return up to \`take\` items.
`,
      changesMd: ['Add top-gainers sorting helper for the leaderboard panel.'],
      starterCode: `
export function topGainers(
  rows: Array<{ symbol: string; changePct: number }>,
  take = 3,
): string[] {
  // TODO
  return [];
}
`,
      tests: level2Tests,
    },
  ],
};
