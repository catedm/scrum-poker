import type { ProblemConfig } from '../types';
import { containerDbProblem } from './containerDb';
import { portfolioProblem } from './portfolio';

export const problems: ProblemConfig[] = [containerDbProblem, portfolioProblem];
