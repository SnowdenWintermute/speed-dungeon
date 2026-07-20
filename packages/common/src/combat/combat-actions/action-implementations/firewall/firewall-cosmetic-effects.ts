import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import { ActionEntity } from "../../../../action-entities/index.js";
import {
  GenericBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { CosmeticEffectOnTargetTransformNode } from "../../combat-action-steps-config.js";

function firewallParticlesParent(
  actionEntity: ActionEntity
): SceneEntityChildTransformNodeIdentifier {
  return {
    sceneEntityIdentifier: {
      type: SceneEntityType.ActionEntityModel,
      entityId: actionEntity.entityProperties.id,
    },
    transformNodeName: GenericBaseChildTransformNodeName.EntityRoot,
  };
}

export function getFirewallCosmeticEffectsToStart(
  actionEntity: ActionEntity
): CosmeticEffectOnTargetTransformNode[] {
  const rankOption = actionEntity.actionEntityProperties.actionOriginData?.actionLevel?.current;
  if (rankOption === undefined) {
    throw new Error("expected firewall to have a rank");
  }

  return [
    {
      name: CosmeticEffectNames.FirewallParticles,
      rankOption,
      parent: firewallParticlesParent(actionEntity),
    },
  ];
}

export function getFirewallCosmeticEffectsToStop(
  actionEntity: ActionEntity
): CosmeticEffectOnTargetTransformNode[] {
  return [
    {
      name: CosmeticEffectNames.FirewallParticles,
      parent: firewallParticlesParent(actionEntity),
    },
  ];
}
