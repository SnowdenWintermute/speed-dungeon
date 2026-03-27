import { CosmeticEffect, CosmeticEffectNames } from "@speed-dungeon/common";
import { SceneEntity } from "./index.js";
import { StandardMaterial } from "@babylonjs/core";

export class CosmeticEffectManager {
  cosmeticEffects: Partial<
    Record<CosmeticEffectNames, { effect: CosmeticEffect; referenceCount: number }>
  > = {};
  constructor(private parent: SceneEntity) {}

  hasActiveEffects() {
    return Object.entries(this.cosmeticEffects).length > 0;
  }

  setMaterial(material: StandardMaterial) {
    this.parent.iterMeshes().forEach((mesh) => {
      const oldMaterial = mesh.material;
      mesh.material = material;
      oldMaterial?.dispose();
    });
  }

  softCleanup(onComplete: () => void) {
    for (const effectRc of Object.values(this.cosmeticEffects)) {
      effectRc.effect.softCleanup(onComplete);
    }
  }

  cleanup() {
    for (const effectRc of Object.values(this.cosmeticEffects)) {
      effectRc.effect.cleanup();
    }
  }

  stopEffect(name: CosmeticEffectNames, onComplete: () => void) {
    const existingEffectOption = this.cosmeticEffects[name];
    if (!existingEffectOption) {
      return console.info("tried to end a cosmetic effect but couldn't find it");
    }

    console.log("existingEffectOption rc before", existingEffectOption.referenceCount);
    existingEffectOption.referenceCount -= 1;
    console.log("existingEffectOption rc after", existingEffectOption.referenceCount);

    if (existingEffectOption.referenceCount <= 0) {
      console.log("deleting existing effect");
      existingEffectOption.effect.softCleanup(onComplete);
      delete this.cosmeticEffects[name];
    }
  }
}
