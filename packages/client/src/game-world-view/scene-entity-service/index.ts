import { ClientApplication } from "@/client-application";
import {
  COSMETIC_EFFECT_CONSTRUCTORS,
  CosmeticEffectOnTargetTransformNode,
  EntityMotionUpdate,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityIdentifier,
  SceneEntityType,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { CombatantSceneEntityManager } from "./combatant";
import { ActionEntitySceneEntityManager } from "./action-entity";
import { EnvironmentSceneEntityManager } from "./environment";
import { GameWorldView } from "..";
import { TransformNode, Vector3 } from "@babylonjs/core";
import { SceneEntity } from "../scene-entities/base";

export class SceneEntityService {
  readonly combatantSceneEntityManager: CombatantSceneEntityManager;
  readonly actionEntityManager: ActionEntitySceneEntityManager;
  readonly environmentEntityManager: EnvironmentSceneEntityManager;
  readonly pendingCosmeticEffectsToStart: CosmeticEffectOnTargetTransformNode[] = [];

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

  clearAll() {
    this.combatantSceneEntityManager.clearAll();
    this.environmentEntityManager.clearAll();
    this.actionEntityManager.clearAll();
  }

  updateEntities(deltaTime: number) {
    this.actionEntityManager.updateEntities(deltaTime);
    this.combatantSceneEntityManager.updateEntities(deltaTime);
  }

  queueCosmeticEffectStart(toStart: CosmeticEffectOnTargetTransformNode[]) {
    for (const effect of toStart) {
      const sceneEntity = this.getOptionFromIdentifier(effect.parent.sceneEntityIdentifier);
      if (sceneEntity) {
        this.startCosmeticEffect(sceneEntity, effect);
      } else {
        this.pendingCosmeticEffectsToStart.push(effect);
      }
    }
  }

  startCosmeticEffect(
    sceneEntity: SceneEntity,
    cosmeticEffect: CosmeticEffectOnTargetTransformNode
  ) {
    const { name, parent, lifetime, rankOption, offsetOption, unattached } = cosmeticEffect;
    const cosmeticEffectManager = sceneEntity.cosmeticEffectManager;
    const existingEffectOption = cosmeticEffectManager.cosmeticEffects[name];
    const { scene } = this.gameWorldView;

    let effectToStartLifetimeTimeout;

    if (existingEffectOption) {
      existingEffectOption.referenceCount += 1;
      effectToStartLifetimeTimeout = existingEffectOption.effect;
    } else {
      const effect = new COSMETIC_EFFECT_CONSTRUCTORS[name](
        this.gameWorldView.scene,
        rankOption || 1
      );

      if (effect.setsMaterial) {
        const material = effect.setsMaterial(scene);
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

  startPendingQueuedEffects(sceneEntity: SceneEntity) {
    const { sceneEntityService } = this.gameWorldView;
    const pendingList = sceneEntityService.pendingCosmeticEffectsToStart;

    const toKeep: CosmeticEffectOnTargetTransformNode[] = [];

    for (const toStart of pendingList) {
      const { parent } = toStart;
      const sceneEntityWithPending = this.getOptionFromIdentifier(parent.sceneEntityIdentifier);
      if (!sceneEntityWithPending) {
        toKeep.push(toStart);
        continue;
      }

      const { entityId } = sceneEntityWithPending;
      if (entityId !== sceneEntity.entityId) {
        toKeep.push(toStart);
        continue;
      }

      this.startCosmeticEffect(sceneEntity, toStart);
    }

    sceneEntityService.pendingCosmeticEffectsToStart.length = 0;
    sceneEntityService.pendingCosmeticEffectsToStart.push(...toKeep);
  }

  stopCosmeticEffects(toEnd: CosmeticEffectOnTargetTransformNode[]) {
    for (const cosmeticEffectOnEntity of toEnd) {
      const { name, parent } = cosmeticEffectOnEntity;
      const sceneEntityOption = this.getOptionFromIdentifier(parent.sceneEntityIdentifier);
      if (!sceneEntityOption) {
        return;
      }
      const { cosmeticEffectManager } = sceneEntityOption;
      cosmeticEffectManager.stopEffect(name, () => {
        // no-op
      });
    }
  }

  getOptionFromMotionUpdate(entityMotionUpdate: EntityMotionUpdate) {
    const { entityId } = entityMotionUpdate;
    if (entityMotionUpdate.entityType === SpawnableEntityType.Combatant) {
      return this.combatantSceneEntityManager.getOptional(entityId);
    } else {
      return this.actionEntityManager.getOptional(entityId);
    }
  }

  getOptionFromIdentifier(identifier: SceneEntityIdentifier) {
    const { type } = identifier;

    switch (type) {
      case SceneEntityType.ActionEntityModel: {
        return this.actionEntityManager.getOptional(identifier.entityId);
      }
      case SceneEntityType.CharacterModel: {
        return this.combatantSceneEntityManager.getOptional(identifier.entityId);
      }
      case SceneEntityType.CharacterEquipmentModel: {
        try {
          const combatantEntityWithHoldable = this.combatantSceneEntityManager.getOptional(
            identifier.characterModelId
          );
          const { slot } = identifier;

          return combatantEntityWithHoldable?.equipmentManager.requireHoldableModelInSlot(slot);
        } catch {
          return undefined;
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
