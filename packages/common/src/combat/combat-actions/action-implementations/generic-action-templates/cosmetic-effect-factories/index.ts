import { CosmeticEffectNames } from "../../../../../action-entities/cosmetic-effect.js";
import { ActionResolutionStepContext } from "../../../../../action-processing/index.js";
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
          entityId: context.combatantContext.combatant.entityProperties.id,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
      },
    };
    return effect;
  }
}
