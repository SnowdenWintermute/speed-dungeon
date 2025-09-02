import {
  CombatActionCombatLogProperties,
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
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import cloneDeep from "lodash.clonedeep";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
  createHitOutcomeProperties,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const targetingProperties = cloneDeep(
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent]
);

targetingProperties.shouldExecute = DAMAGING_ACTIONS_COMMON_CONFIG.shouldExecute;

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.addsPropertiesFromHoldableSlot = HoldableSlotType.OffHand;
hitOutcomeOverrides.accuracyModifier = OFF_HAND_ACCURACY_MODIFIER;
hitOutcomeOverrides.critChanceModifier = OFF_HAND_CRIT_CHANCE_MODIFIER;
hitOutcomeOverrides.resourceChangeValuesModifier = OFF_HAND_DAMAGE_MODIFIER;

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.MELEE_ATTACK,
  hitOutcomeOverrides
);

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.OFF_HAND_MELEE_ATTACK();

export const ATTACK_MELEE_OFF_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using equipment in off hand",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: DurabilityLossCondition.OnHit },
    },
  },
  stepsConfig,
  hierarchyProperties: { ...BASE_ACTION_HIERARCHY_PROPERTIES, getParent: () => ATTACK },
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  ATTACK_MELEE_OFF_HAND_CONFIG
);
