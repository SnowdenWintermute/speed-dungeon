import {
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { EquipmentType } from "../../../../items/equipment/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL();

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BOW_ATTACK,
  {}
);

export const ATTACK_RANGED_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using ranged weapon",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
    {
      getRequiredEquipmentTypeOptions: () => [EquipmentType.TwoHandedRangedWeapon],
    }
  ),
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_RANGED_MAIN_HAND_ATTACK(),
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ATTACK,
    getConcurrentSubActions(context) {
      const expectedProjectile = context.tracker.getFirstExpectedSpawnedActionEntity();

      const { rank, targets } = context.tracker.actionExecutionIntent;

      return [
        {
          user: expectedProjectile.actionEntity,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.AttackRangedMainhandProjectile,
            rank,
            targets
          ),
        },
      ];
    },
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  ATTACK_RANGED_MAIN_HAND_CONFIG
);
