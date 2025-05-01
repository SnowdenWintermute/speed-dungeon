import { CosmeticEffect, CosmeticEffectNames } from "@speed-dungeon/common";

export class CosmeticEffectManager {
  cosmeticEffect: Partial<Record<CosmeticEffectNames, CosmeticEffect>> = {};
  constructor() {}

  softCleanup() {
    for (const effect of Object.values(this.cosmeticEffect)) effect.softCleanup();
  }
  cleanup() {
    for (const effect of Object.values(this.cosmeticEffect)) effect.cleanup();
  }
}
