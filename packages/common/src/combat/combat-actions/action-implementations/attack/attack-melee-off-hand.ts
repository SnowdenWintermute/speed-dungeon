import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  OFF_HAND_ACCURACY_MODIFIER,
  OFF_HAND_CRIT_CHANCE_MODIFIER,
  OFF_HAND_DAMAGE_MODIFIER,
} from "../../../../app-consts.js";
import { ATTACK } from "./index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { getStandardActionCritChance } from "../../action-calculation-utils/standard-action-calculations.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { getMeleeAttackDestination } from "../../combat-action-destination-getters.js";
import { getMeleeAttackBaseStepsConfig } from "./base-melee-attack-steps-config.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  accuracyModifier: OFF_HAND_ACCURACY_MODIFIER,
  addsPropertiesFromHoldableSlot: HoldableSlotType.OffHand,
  getCritChance: function (user: CombatantProperties): number {
    return (
      getStandardActionCritChance(user, CombatAttribute.Dexterity) * OFF_HAND_CRIT_CHANCE_MODIFIER
    );
  },
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeProperties = getAttackResourceChangeProperties(
      hitOutcomeProperties,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.OffHand
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    hpChangeProperties.baseValues.mult(OFF_HAND_DAMAGE_MODIFIER);
    return hpChangeProperties;
  },
};

const stepsConfig = getMeleeAttackBaseStepsConfig(HoldableSlotType.OffHand);
// don't show a movement animation here
stepsConfig.steps[ActionResolutionStepType.InitialPositioning] = {
  getDestination: getMeleeAttackDestination,
};

export const ATTACK_MELEE_OFF_HAND_CONFIG: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "Attack target using equipment in off hand",
  origin: CombatActionOrigin.Attack,
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: DurabilityLossCondition.OnHit },
    },
  },
  stepsConfig,

  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  ATTACK_MELEE_OFF_HAND_CONFIG
);
