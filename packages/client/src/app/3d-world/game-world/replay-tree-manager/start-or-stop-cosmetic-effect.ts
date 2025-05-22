import {
  ERROR_MESSAGES,
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
  CosmeticEffectOnEntity,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { Vector3 } from "@babylonjs/core";
import { SceneEntity } from "../../scene-entities";

export function startOrStopCosmeticEffects(
  cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[],
  cosmeticEffectsToStop?: CosmeticEffectOnEntity[]
) {
  if (cosmeticEffectsToStart?.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    for (const { name, parent, lifetime } of cosmeticEffectsToStart) {
      const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption);

      if (lifetime !== undefined) {
        effect.lifetimeTimeout = setTimeout(() => {
          effect.softCleanup();
        }, lifetime);
      }

      const cosmeticEffectManager = SceneEntity.getFromIdentifier(
        parent.sceneEntityIdentifier
      ).cosmeticEffectManager;

      cosmeticEffectManager.cosmeticEffect[name]?.softCleanup();
      cosmeticEffectManager.cosmeticEffect[name] = effect;

      console.log(
        "trying to find model to parent cosmetic effect on with id",
        parent.sceneEntityIdentifier
      );

      const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(parent);

      effect.transformNode.setParent(targetTransformNode);
      effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
    }
  }

  if (cosmeticEffectsToStop?.length) {
    for (const cosmeticEffectOnEntity of cosmeticEffectsToStop) {
      const { sceneEntityIdentifier, name } = cosmeticEffectOnEntity;

      const sceneEntity = SceneEntity.getFromIdentifier(sceneEntityIdentifier);
      const { cosmeticEffectManager } = sceneEntity;

      cosmeticEffectManager.cosmeticEffect[name]?.softCleanup();
      delete cosmeticEffectManager.cosmeticEffect[name];
    }
  }
}
