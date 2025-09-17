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
  for (const cosmeticEffectOnEntity of cosmeticEffectsToStop || []) {
    const { name, parent } = cosmeticEffectOnEntity;
    const sceneEntity = SceneEntity.getFromIdentifier(parent.sceneEntityIdentifier);
    const { cosmeticEffectManager } = sceneEntity;
    cosmeticEffectManager.stopEffect(name, () => {});
  }

  if (cosmeticEffectsToStart?.length) {
    const sceneOption = gameWorld.current?.scene;
    if (!sceneOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    let effectToStartLifetimeTimeout;

    for (const { name, parent, lifetime, rankOption, offsetOption } of cosmeticEffectsToStart) {
      const cosmeticEffectManager = SceneEntity.getFromIdentifier(
        parent.sceneEntityIdentifier
      ).cosmeticEffectManager;

      const existingEffectOption = cosmeticEffectManager.cosmeticEffects[name];

      if (existingEffectOption) {
        existingEffectOption.referenceCount += 1;
        effectToStartLifetimeTimeout = existingEffectOption.effect;
      } else {
        const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption, rankOption || 1);

        cosmeticEffectManager.cosmeticEffects[name] = { effect, referenceCount: 1 };
        const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(parent);
        effect.transformNode.setParent(targetTransformNode);
        const offset = offsetOption || Vector3.Zero();
        effect.transformNode.setPositionWithLocalVector(offset);
        effectToStartLifetimeTimeout = effect;
      }

      if (lifetime !== undefined) {
        effectToStartLifetimeTimeout.addLifetimeTimeout(
          setTimeout(() => {
            cosmeticEffectManager.stopEffect(name, () => {});
          }, lifetime)
        );
      }
    }
  }
}
