/**
 * The solver values of the shipped levels 1–10 (`levels:solve`, SOLVER_VERSION 8, RULES_VERSION 6; CL-V3-01). Written by
 * `node tools/gen/write-shipped-expected.ts` from the solver's own output: a change of a level file or of the solver shows up
 * here first. `scan` 'full' = complete state-space scan (proven `min`, K-50 metrics); 'large' = large-level search (`best` is
 * an upper bound of `min`, `lowerBound` = N or N + 1) plus the random-walk dead-state gate and the placement-first play
 * proxy (CL-V3-03; `policyLoose` = win rate within moves + N / 2, not `ahaMin`; CL-V3C-13: 400 plays, tight and loose on
 * the same plays).
 */
export interface ShippedFull {
  readonly minShifts: number;
  readonly shiftsBySegment: readonly number[];
  readonly firstNeedDepth: number | null;
  readonly choices: readonly number[];
  readonly maxCover: number | null;
  readonly depLater: number;
  readonly crossDeps: number;
  readonly parkSlack: number | null;
  readonly forced: number;
  readonly greedyExcess: number | null;
  readonly greedyWin: number;
  readonly ahaMin: number;
  readonly branch3: number | null;
  readonly skillMid: number;
}

export interface ShippedExpectation {
  readonly level: number;
  readonly difficulty: string;
  readonly moves: number;
  readonly blocks: number;
  readonly scan: 'full' | 'large';
  readonly best: number;
  readonly lowerBound: number;
  readonly yao: readonly [number, number];
  readonly band: readonly [number, number];
  readonly warnings: readonly string[];
  readonly eventLogHash: string;
  readonly policyLoose: number | null;
  readonly policyTight: number | null;
  readonly full?: ShippedFull;
}

export const SHIPPED: Readonly<Record<number, ShippedExpectation>> = {
  1: {
    level: 1,
    difficulty: 'easy',
    moves: 12,
    blocks: 8,
    scan: 'full',
    best: 8,
    lowerBound: 8,
    yao: [8, 0],
    band: [12, 14],
    warnings: [],
    eventLogHash: '0d5cd6e5477c3b38',
    policyLoose: null,
    policyTight: null,
    full: {
      minShifts: 0,
      shiftsBySegment: [0, 0],
      firstNeedDepth: 0,
      choices: [18, 18, 16],
      maxCover: 3,
      depLater: 0,
      crossDeps: 8,
      parkSlack: null,
      forced: 4,
      greedyExcess: 0,
      greedyWin: 1,
      ahaMin: 0,
      branch3: 0.5,
      skillMid: 0.99,
    },
  },
  2: {
    level: 2,
    difficulty: 'easy',
    moves: 12,
    blocks: 8,
    scan: 'full',
    best: 8,
    lowerBound: 8,
    yao: [8, 0],
    band: [12, 14],
    warnings: [],
    eventLogHash: '68183d3e9b45cb24',
    policyLoose: null,
    policyTight: null,
    full: {
      minShifts: 0,
      shiftsBySegment: [0, 0],
      firstNeedDepth: 0,
      choices: [11, 12, 29],
      maxCover: 3,
      depLater: 1,
      crossDeps: 3,
      parkSlack: null,
      forced: 6,
      greedyExcess: 0,
      greedyWin: 1,
      ahaMin: 0,
      branch3: 0.23,
      skillMid: 0.97,
    },
  },
  3: {
    level: 3,
    difficulty: 'easy',
    moves: 15,
    blocks: 9,
    scan: 'large',
    best: 11,
    lowerBound: 10,
    yao: [9, 0],
    band: [15, 17],
    warnings: [],
    eventLogHash: 'b484301f06963e42',
    policyLoose: 0.39,
    policyTight: 0.24,
  },
  4: {
    level: 4,
    difficulty: 'easy',
    moves: 16,
    blocks: 10,
    scan: 'large',
    best: 12,
    lowerBound: 11,
    yao: [10, 0],
    band: [16, 18],
    warnings: [],
    eventLogHash: 'e4f5bf2770578c87',
    policyLoose: 0.3,
    policyTight: 0.17,
  },
  5: {
    level: 5,
    difficulty: 'normal',
    moves: 18,
    blocks: 12,
    scan: 'large',
    best: 14,
    lowerBound: 13,
    yao: [12, 0],
    band: [18, 21],
    warnings: [],
    eventLogHash: 'aa2b8f84c7abebf9',
    policyLoose: 0.55,
    policyTight: 0.29,
  },
  6: {
    level: 6,
    difficulty: 'normal',
    moves: 23,
    blocks: 17,
    scan: 'large',
    best: 19,
    lowerBound: 18,
    yao: [17, 0],
    band: [23, 26],
    warnings: [],
    eventLogHash: '4c0993e7dce407d1',
    policyLoose: 0.44,
    policyTight: 0.23,
  },
  7: {
    level: 7,
    difficulty: 'normal',
    moves: 24,
    blocks: 19,
    scan: 'large',
    best: 20,
    lowerBound: 20,
    yao: [19, 0],
    band: [24, 27],
    warnings: [],
    eventLogHash: '09ad4ffc77d08674',
    policyLoose: 0.59,
    policyTight: 0.34,
  },
  8: {
    level: 8,
    difficulty: 'normal',
    moves: 26,
    blocks: 18,
    scan: 'large',
    best: 20,
    lowerBound: 19,
    yao: [18, 0],
    band: [24, 27],
    warnings: [],
    eventLogHash: '5a592fc8e07efad5',
    policyLoose: 0.45,
    policyTight: 0.28,
  },
  9: {
    level: 9,
    difficulty: 'normal',
    moves: 25,
    blocks: 18,
    scan: 'large',
    best: 20,
    lowerBound: 19,
    yao: [18, 0],
    band: [24, 27],
    warnings: [],
    eventLogHash: 'd54b0333cfebe442',
    policyLoose: 0.38,
    policyTight: 0.21,
  },
  10: {
    level: 10,
    difficulty: 'hard',
    moves: 24,
    blocks: 20,
    scan: 'large',
    best: 21,
    lowerBound: 21,
    yao: [20, 0],
    band: [22, 25],
    warnings: [],
    eventLogHash: 'f784c7992f76449c',
    policyLoose: 0.54,
    policyTight: 0.45,
  },
};
