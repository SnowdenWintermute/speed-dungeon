import { CosmeticEffectNames } from "../../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepContext } from "../../../../../action-processing/index.js";
import { EntityId, Milliseconds } from "../../../../../primatives/index.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../../scene-entities/index.js";
import { CosmeticEffectOnTargetTransformNode } from "../../../combat-action-steps-config.js";

export class CosmeticEffectInstructionFactory {
  static createParticlesOnOffhand(name: CosmeticEffectNames, context: ActionResolutionStepContext) {
    const effect: CosmeticEffectOnTargetTransformNode = {
      name,
      parent: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: context.actionUserContext.actionUser.getEntityId(),
        },
        transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
      },
    };
    return effect;
  }

  static createParticlesOnTargetBody(
    name: CosmeticEffectNames,
    lifetime: Milliseconds,
    targetId: EntityId
  ) {
    const effect: CosmeticEffectOnTargetTransformNode = {
      name,
      lifetime,
      parent: {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: targetId,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      },
    };
    return effect;
  }
}
