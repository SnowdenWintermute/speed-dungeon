import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { CosmeticEffectNames } from "../../../../action-entities/cosmetic-effect.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { iceBoltProjectileHitOutcomeProperties } from "./ice-bolt-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { getProjectileShootingActionBaseStepsConfig } from "../getProjectileShootingActionBaseStepsConfig.js";
import { ProjectileShootingActionType } from "../projectile-shooting-action-animation-names.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { getSpellCastCombatLogMessage } from "../combat-log-message-getters.js";
import { AbilityType } from "../../../../abilities/index.js";

const stepsConfig = getProjectileShootingActionBaseStepsConfig(ProjectileShootingActionType.Spell);
stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.InitialPositioning],
  getCosmeticsEffectsToStart: (context) => {
    return [
      {
        name: CosmeticEffectNames.FrostParticleAccumulation,
        parent: {
          sceneEntityIdentifier: {
            type: SceneEntityType.CharacterModel,
            entityId: context.combatantContext.combatant.entityProperties.id,
          },
          transformNodeName: CombatantBaseChildTransformNodeName.OffhandEquipment,
        },
      },
    ];
  },
};
stepsConfig.steps[ActionResolutionStepType.FinalPositioning] = {
  ...stepsConfig.steps[ActionResolutionStepType.FinalPositioning],
  getCosmeticsEffectsToStop: (context) => [
    {
      name: CosmeticEffectNames.FrostParticleAccumulation,
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: context.combatantContext.combatant.entityProperties.id,
      },
    },
  ],
};

const config: CombatActionComponentConfig = {
  description: "Summon an icy projectile",
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Fire }],
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
    requiresCombatTurnInThisContext: () => false,
  },
  stepsConfig,
  getOnUseMessage: (data) =>
    getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[CombatActionName.IceBoltParent]),
  shouldExecute: () => true,
  getConcurrentSubActions(context) {
    return [
      new CombatActionExecutionIntent(
        CombatActionName.IceBoltProjectile,
        context.tracker.actionExecutionIntent.targets,
        context.tracker.actionExecutionIntent.level
      ),
    ];
  },
  getChildren: () => [],
  getParent: () => null,
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
