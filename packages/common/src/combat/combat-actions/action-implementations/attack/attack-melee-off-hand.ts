import {
  CombatActionGameLogProperties,
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
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
  createHitOutcomeProperties,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";

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

const targetingPropertiesOverrides: Partial<CombatActionTargetingPropertiesConfig> = {
  executionPreconditions: [
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.UserIsAlive],
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.HasEnoughActionPoints],
    ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.WasNotCounterattacked],
    ACTION_EXECUTION_PRECONDITIONS[
      ActionExecutionPreconditions.WasNotWearing2HWeaponOnPreviousAction
    ],
  ],
};

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE,
  targetingPropertiesOverrides
);

export const ATTACK_MELEE_OFF_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using equipment in off hand",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties,
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_MELEE_OFF_HAND_ATTACK(),
  stepsConfig,
  hierarchyProperties: { ...BASE_ACTION_HIERARCHY_PROPERTIES, getParent: () => ATTACK },
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  ATTACK_MELEE_OFF_HAND_CONFIG
);
