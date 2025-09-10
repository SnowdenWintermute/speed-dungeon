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

  stopEffect(name: CosmeticEffectNames) {
    const existingEffectOption = this.cosmeticEffects[name];
    if (!existingEffectOption)
      return console.info("tried to end a cosmetic effect but couldn't find it");
    existingEffectOption.referenceCount -= 1;
    console.log("stopped effect:", name, "RC:", existingEffectOption.referenceCount);

    if (existingEffectOption.referenceCount <= 0) {
      existingEffectOption.effect.softCleanup();
      delete this.cosmeticEffects[name];
    }
  }
}
