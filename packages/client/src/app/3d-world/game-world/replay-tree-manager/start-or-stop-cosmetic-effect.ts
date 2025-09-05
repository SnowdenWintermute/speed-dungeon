import {
  ERROR_MESSAGES,
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { Vector3 } from "@babylonjs/core";
import { SceneEntity } from "../../scene-entities";

export function startOrStopCosmeticEffects(
  cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[],
  cosmeticEffectsToStop?: CosmeticEffectOnTargetTransformNode[]
) {
  if (cosmeticEffectsToStart?.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    for (const { name, parent, lifetime } of cosmeticEffectsToStart) {
      const cosmeticEffectManager = SceneEntity.getFromIdentifier(
        parent.sceneEntityIdentifier
      ).cosmeticEffectManager;

      const existingEffectOption = cosmeticEffectManager.cosmeticEffects[name];

      if (existingEffectOption) existingEffectOption.referenceCount += 1;
      else {
        const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption);

        if (lifetime !== undefined) {
          effect.lifetimeTimeout = setTimeout(() => {
            cosmeticEffectManager.stopEffect(name);
          }, lifetime);
        }

        cosmeticEffectManager.cosmeticEffects[name] = { effect, referenceCount: 1 };
        const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(parent);
        effect.transformNode.setParent(targetTransformNode);
        effect.transformNode.setPositionWithLocalVector(Vector3.Zero());
      }
    }
  }

  if (cosmeticEffectsToStop === undefined) return;

  for (const cosmeticEffectOnEntity of cosmeticEffectsToStop) {
    const { name, parent } = cosmeticEffectOnEntity;
    const sceneEntity = SceneEntity.getFromIdentifier(parent.sceneEntityIdentifier);
    const { cosmeticEffectManager } = sceneEntity;
    cosmeticEffectManager.stopEffect(name);
  }
}
