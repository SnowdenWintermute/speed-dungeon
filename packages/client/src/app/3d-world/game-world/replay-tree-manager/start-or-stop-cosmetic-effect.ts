import {
  CosmeticEffectNames,
  ERROR_MESSAGES,
  Milliseconds,
  COSMETIC_EFFECT_CONSTRUCTORS,
  SceneEntityChildTransformNodeIdentifier,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "../../scene-entities/cosmetic-effect-manager";
import { SceneEntity } from "../../scene-entities";

export function startOrStopCosmeticEffect(
  cosmeticEffectToStart: {
    name: CosmeticEffectNames;
    parent: SceneEntityChildTransformNodeIdentifier;
    lifetime?: Milliseconds;
  }[],
  cosmeticEffectToStop: CosmeticEffectNames[],
  cosmeticEffectManager: CosmeticEffectManager
) {
  if (cosmeticEffectToStart.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    for (const { name, parent, lifetime } of cosmeticEffectToStart) {
      const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption);

      if (lifetime !== undefined) {
        effect.lifetimeTimeout = setTimeout(() => {
          effect.softCleanup();
        }, lifetime);
      }

      cosmeticEffectManager.cosmeticEffect[name]?.softCleanup();
      cosmeticEffectManager.cosmeticEffect[name] = effect;

      console.log("trying to find model to parent cosmetic effect on with id", parent.entityId);

      const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(parent);

      effect.transformNode.setParent(targetTransformNode);
      effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
    }
  }

  if (cosmeticEffectToStop.length) {
    for (const vfxName of cosmeticEffectToStop) {
      cosmeticEffectManager.cosmeticEffect[vfxName]?.softCleanup();
      delete cosmeticEffectManager.cosmeticEffect[vfxName];
    }
  }
}
