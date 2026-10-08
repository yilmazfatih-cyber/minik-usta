import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

/** Names imported from src/core modules, per file. */
function coreImports(file: string): { module: string; names: string[] }[] {
  const code = readFileSync(file, 'utf8');
  const out: { module: string; names: string[] }[] = [];
  for (const m of code.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'([^']*\/core\/[^']*)'/g)) {
    if (m[1]) continue; // type-only import
    const names = (m[2] ?? '')
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0 && !n.startsWith('type '));
    out.push({ module: m[3] ?? '', names });
  }
  return out;
}

/**
 * Core functions that change a GameState. The scene only commits through `GameSession` (TECH §1.4 "sahne durumu asla
 * kendisi değiştirmez"): none of them may be imported by src/scenes or src/ui.
 */
const WRITERS = new Set([
  'applyMove',
  'movePiece',
  'lockPiece',
  'stickPiece',
  'occupyPiece',
  'vacatePiece',
  'refreshSiteMasks',
  'settleYard',
  'settlePlacement',
  'returnBrokenPiece',
  'applyTrowel',
  'grantTrowels',
  'comboOnCorrect',
  'comboReset',
  'enqueuePiece',
  'removeQueueAt',
  'deliverQueue',
  'enqueueBatchesFor',
  'addGoalCount',
  'setBuildProgress',
]);

/**
 * No exemption: the Faz 2 tutorial never-lock guarantee (the only scene code that simulated a release on a buffer copy)
 * is gone with the required step (K-53, WP-H); the glove check (tutorial/glove.ts) only reads the drag BFS.
 */
const SIMULATION_ONLY: Readonly<Record<string, readonly string[]>> = {};

describe('scene layering (TECH 1.1–1.4)', () => {
  const files = [...tsFiles(join(ROOT, 'src/scenes')), ...tsFiles(join(ROOT, 'src/ui'))];

  it('TECH 1.4 scenes and ui never write the game state: no core writer is imported, moves go through GameSession', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = file.slice(ROOT.length).split('\\').join('/');
      for (const { module, names } of coreImports(file)) {
        for (const n of names) {
          if (SIMULATION_ONLY[rel]?.includes(n)) continue;
          if (WRITERS.has(n) || /^set[A-Z]/.test(n)) offenders.push(`${rel}: ${n} from ${module}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('K-53 tutorial never blocks input: no scene file simulates a move, the tutorial modules import no core writer', () => {
    expect(Object.keys(SIMULATION_ONLY)).toEqual([]);
    for (const f of [
      'TutorialController.ts',
      'TutorialPresence.ts',
      'glove.ts',
      'highlights.ts',
      'contextTips.ts',
    ]) {
      const code = readFileSync(join(ROOT, 'src/scenes/level/tutorial', f), 'utf8');
      expect(code, f).not.toMatch(/applyMove|cloneState/);
    }
  });

  it('TECH 1.4 / 2R.15 the level scene commits drags through GameSession.apply (one package) and asks the core for the shadow', () => {
    const scene = readFileSync(join(ROOT, 'src/scenes/level/LevelScene.ts'), 'utf8');
    expect(scene).toMatch(
      /const move = \{ kind: 'drag', pieceId: id, to: node \} as const;\s+const res = this\.applyAction\(move/,
    );
    expect(scene).toMatch(/const res = game\.apply\(action\);/);
    expect(scene).toMatch(/computeFall\(s, session\.pieceId, node, \{ rules: this\.hooks\.fall \}\)/);
    const drag = readFileSync(join(ROOT, 'src/scenes/level/DragController.ts'), 'utf8');
    expect(drag).toMatch(/tryBeginDrag\(s, id, host\.dragRules\(\)\)/);
    expect(drag).toMatch(/\.follow\(target\.px, target\.py\)/);
  });
});
