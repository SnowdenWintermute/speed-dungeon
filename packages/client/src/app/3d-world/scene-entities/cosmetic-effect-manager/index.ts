import { CosmeticEffect, CosmeticEffectNames } from "@speed-dungeon/common";

export class CosmeticEffectManager {
  cosmeticEffects: Partial<
    Record<CosmeticEffectNames, { effect: CosmeticEffect; referenceCount: number }>
  > = {};
  constructor() {}

  hasActiveEffects() {
    return Object.entries(this.cosmeticEffects).length > 0;
  }

  softCleanup(onComplete: () => void) {
    for (const effectRc of Object.values(this.cosmeticEffects))
      effectRc.effect.softCleanup(onComplete);
  }
  cleanup() {
    for (const effectRc of Object.values(this.cosmeticEffects)) effectRc.effect.cleanup();
  }

  stopEffect(name: CosmeticEffectNames, onComplete: () => void) {
    const existingEffectOption = this.cosmeticEffects[name];
    if (!existingEffectOption)
      return console.info("tried to end a cosmetic effect but couldn't find it");
    existingEffectOption.referenceCount -= 1;
    console.log("stopped effect:", name, "RC:", existingEffectOption.referenceCount);

    if (existingEffectOption.referenceCount <= 0) {
      existingEffectOption.effect.softCleanup(onComplete);
      delete this.cosmeticEffects[name];
    }
  }
}
