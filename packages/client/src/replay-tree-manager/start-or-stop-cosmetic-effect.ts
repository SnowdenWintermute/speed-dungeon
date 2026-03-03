import {
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
} from "@speed-dungeon/common";
import { Vector3 } from "@babylonjs/core";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { SceneEntity } from "@/game-world-view/scene-entities";

export function startOrStopCosmeticEffects(
  cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[],
  cosmeticEffectsToStop?: CosmeticEffectOnTargetTransformNode[]
) {
  for (const cosmeticEffectOnEntity of cosmeticEffectsToStop || []) {
    const { name, parent } = cosmeticEffectOnEntity;
    const sceneEntity = SceneEntity.getFromIdentifier(
      parent.sceneEntityIdentifier,
      getGameWorldView()
    );
    const { cosmeticEffectManager } = sceneEntity;
    cosmeticEffectManager.stopEffect(name, () => {
      // no-op
    });
  }

  if (cosmeticEffectsToStart?.length) {
    const sceneOption = getGameWorldView().scene;

    let effectToStartLifetimeTimeout;

    for (const {
      name,
      parent,
      lifetime,
      rankOption,
      offsetOption,
      unattached,
    } of cosmeticEffectsToStart) {
      const cosmeticEffectManager = SceneEntity.getFromIdentifier(
        parent.sceneEntityIdentifier,
        getGameWorldView()
      ).cosmeticEffectManager;

      const existingEffectOption = cosmeticEffectManager.cosmeticEffects[name];

      if (existingEffectOption) {
        existingEffectOption.referenceCount += 1;
        effectToStartLifetimeTimeout = existingEffectOption.effect;
      } else {
        const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](sceneOption, rankOption || 1);

        if (effect.setsMaterial) {
          const material = effect.setsMaterial(sceneOption);
          cosmeticEffectManager.setMaterial(material);
        }

        cosmeticEffectManager.cosmeticEffects[name] = { effect, referenceCount: 1 };
        const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
          parent,
          getGameWorldView()
        );

        if (!unattached) {
          effect.transformNode.setParent(targetTransformNode);
          const offset = offsetOption || Vector3.Zero();
          effect.transformNode.setPositionWithLocalVector(offset);
        } else {
          effect.transformNode.setAbsolutePosition(targetTransformNode.position);
        }

        effectToStartLifetimeTimeout = effect;
      }

      if (lifetime !== undefined) {
        effectToStartLifetimeTimeout.addLifetimeTimeout(
          setTimeout(() => {
            cosmeticEffectManager.stopEffect(name, () => {
              // no-op
            });
          }, lifetime)
        );
      }
    }
  }
}
