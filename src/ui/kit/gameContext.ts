/**
 * Game-wide inputs of the v2 win layer when its builder passes none (scenes/level/LevelWindows builds `WinScreen` with
 * the Phase 2 arguments only): the asset service, the reduced-motion setting and the tree house reveal after this win
 * (META §10: distinct slice levels won / 10 — the win is already in the save, TECH §11.1 "kazanma anında").
 */
import type Phaser from 'phaser';
import { SLICE_LEVEL_COUNT, wonLevels } from '../../meta/home.ts';
import type { AssetService } from '../../services/assets.ts';
import { gameAssets } from '../../scenes/AssetLoaderScene.ts';
import { appSave, reducedMotion } from '../../scenes/appServices.ts';

export interface WinContext {
  readonly assets: AssetService;
  readonly reduced: boolean;
  readonly structureRatio: number;
}

export function winContext(game: Phaser.Game): WinContext {
  return {
    assets: gameAssets(game),
    reduced: reducedMotion(),
    structureRatio: Math.min(1, wonLevels(appSave().data) / SLICE_LEVEL_COUNT),
  };
}
