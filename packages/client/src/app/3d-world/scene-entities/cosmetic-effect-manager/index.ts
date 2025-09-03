import { CosmeticEffect, CosmeticEffectNames } from "@speed-dungeon/common";

export class CosmeticEffectManager {
  cosmeticEffects: Partial<
    Record<CosmeticEffectNames, { effect: CosmeticEffect; referenceCount: number }>
  > = {};
  constructor() {}

  softCleanup() {
    for (const effectRc of Object.values(this.cosmeticEffects)) effectRc.effect.softCleanup();
  }
  cleanup() {
    for (const effectRc of Object.values(this.cosmeticEffects)) effectRc.effect.cleanup();
  }
}
