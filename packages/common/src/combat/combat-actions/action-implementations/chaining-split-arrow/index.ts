import {
  ActionResolutionStepConfig,
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import {
  ActionResolutionStepType,
  EntityMotionUpdate,
} from "../../../../action-processing/index.js";
import { SpawnableEntityType, getSpawnableEntityId } from "../../../../spawnables/index.js";
import { EquipmentType } from "../../../../items/equipment/index.js";
import { AbilityType } from "../../../../abilities/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL;
const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.RecoveryMotion] = {
  getAuxiliaryEntityMotions: (context) => {
    const dummyArrowOption = context.tracker.spawnedEntityOption;
    if (!dummyArrowOption) return [];

    const actionEntityId = getSpawnableEntityId(dummyArrowOption);
    //
    const toReturn: EntityMotionUpdate[] = [];

    toReturn.push({
      entityId: actionEntityId,
      entityType: SpawnableEntityType.ActionEntity,
      despawn: true,
    });

    return toReturn;
  },
};

const stepsConfig = createStepsConfig(base, { steps: stepOverrides });

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BOW_ATTACK,
  {}
);

const config: CombatActionComponentConfig = {
  description: "Fire arrows which each bounce to up to two additional targets",

  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} fires a chaining split arrow.`;
    },
  }),
  prerequisiteAbilities: [
    { type: AbilityType.Action, actionName: CombatActionName.ExplodingArrowParent },
  ],
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileArea],
    getRequiredEquipmentTypeOptions: () => [EquipmentType.TwoHandedRangedWeapon],
  },

  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  stepsConfig,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,

    getConcurrentSubActions(context) {
      return context.combatantContext
        .getOpponents()
        .filter((opponent) => opponent.combatantProperties.hitPoints > 0)
        .map(
          (opponent) =>
            new CombatActionExecutionIntent(
              CombatActionName.ChainingSplitArrowProjectile,
              {
                type: CombatActionTargetType.Single,
                targetId: opponent.entityProperties.id,
              },
              context.tracker.actionExecutionIntent.level
            )
        );
    },
  },
};

export const CHAINING_SPLIT_ARROW_PARENT = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowParent,
  config
);
