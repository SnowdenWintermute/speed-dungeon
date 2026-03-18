import { ClientApplication } from "@/client-application";
import {
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityIdentifier,
  SceneEntityType,
} from "@speed-dungeon/common";
import { CombatantSceneEntityManager } from "./combatant";
import { ActionEntitySceneEntityManager } from "./action-entity";
import { EnvironmentSceneEntityManager } from "./environment";
import { GameWorldView } from "..";
import { TransformNode, Vector3 } from "@babylonjs/core";

export class SceneEntityService {
  readonly combatantSceneEntityManager: CombatantSceneEntityManager;
  readonly actionEntityManager: ActionEntitySceneEntityManager;
  readonly environmentEntityManager: EnvironmentSceneEntityManager;

  constructor(
    private clientApplication: ClientApplication,
    private gameWorldView: GameWorldView
  ) {
    this.combatantSceneEntityManager = new CombatantSceneEntityManager(
      clientApplication,
      gameWorldView
    );
    this.actionEntityManager = new ActionEntitySceneEntityManager(clientApplication, gameWorldView);
    this.environmentEntityManager = new EnvironmentSceneEntityManager(
      clientApplication,
      gameWorldView
    );
  }

  updateEntities(deltaTime: number) {
    this.actionEntityManager.updateEntities(deltaTime);
    this.combatantSceneEntityManager.updateEntities(deltaTime);
  }

  startOrStopCosmeticEffects(
    cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[],
    cosmeticEffectsToStop?: CosmeticEffectOnTargetTransformNode[]
  ) {
    for (const cosmeticEffectOnEntity of cosmeticEffectsToStop || []) {
      const { name, parent } = cosmeticEffectOnEntity;
      const sceneEntity = this.getFromIdentifier(parent.sceneEntityIdentifier);
      const { cosmeticEffectManager } = sceneEntity;
      cosmeticEffectManager.stopEffect(name, () => {
        // no-op
      });
    }

    if (cosmeticEffectsToStart?.length) {
      const sceneOption = this.gameWorldView.scene;

      let effectToStartLifetimeTimeout;

      for (const {
        name,
        parent,
        lifetime,
        rankOption,
        offsetOption,
        unattached,
      } of cosmeticEffectsToStart) {
        const cosmeticEffectManager = this.getFromIdentifier(
          parent.sceneEntityIdentifier
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
          const targetTransformNode = this.getChildTransformNodeFromIdentifier(parent);

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

  getFromIdentifier(identifier: SceneEntityIdentifier) {
    const { type } = identifier;

    switch (type) {
      case SceneEntityType.ActionEntityModel: {
        return this.actionEntityManager.requireById(identifier.entityId);
      }
      case SceneEntityType.CharacterModel: {
        return this.combatantSceneEntityManager.requireById(identifier.entityId);
      }
      case SceneEntityType.CharacterEquipmentModel: {
        const combatantEntityWithHoldable = this.combatantSceneEntityManager.requireById(
          identifier.characterModelId
        );
        const { slot } = identifier;
        return combatantEntityWithHoldable.equipmentManager.requireHoldableModelInSlot(slot);
      }
    }
  }

  getChildTransformNodeFromIdentifier(
    identifier: SceneEntityChildTransformNodeIdentifier
  ): TransformNode {
    const { sceneEntityIdentifier, transformNodeName } = identifier;
    const sceneEntity = this.getFromIdentifier(sceneEntityIdentifier);
    // @ts-expect-error it can't seem to figure out that our nested tagged type guarantees the correct transformNodeName type
    return sceneEntity.childTransformNodes[transformNodeName];
  }
}
