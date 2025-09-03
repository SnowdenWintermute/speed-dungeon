import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { COMBAT_ACTIONS } from "../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
  createHitOutcomeProperties,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.addsPropertiesFromHoldableSlot = HoldableSlotType.MainHand;

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.MELEE_ATTACK,
  hitOutcomeOverrides
);

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  requiresCombatTurnInThisContext: (context, self) => {
    const user = context.combatantContext.combatant.combatantProperties;

    if (CombatantEquipment.isWearingUsableShield(user)) {
      return true;
    }
    if (CombatantEquipment.isWearingUsableTwoHandedMeleeWeapon(user)) {
      return true;
    }
    if (
      !COMBAT_ACTIONS[CombatActionName.AttackMeleeOffhand].targetingProperties.shouldExecute(
        context.combatantContext,
        context.tracker,
        self
      )
    ) {
      return true; // check if offhand should execute, otherwise if we kill an enemy with main hand
    }
    // we won't end our turn
    if (context.tracker.wasCountered()) {
      return true;
    }

    return false;
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_RANGED_MAIN_HAND_ATTACK;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

export const ATTACK_MELEE_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using equipment in main hand",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.COPY_PARENT_HOSTILE(),
  costProperties,
  hitOutcomeProperties,
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.MAIN_HAND_MELEE_ATTACK(),

  hierarchyProperties: { ...BASE_ACTION_HIERARCHY_PROPERTIES, getParent: () => ATTACK },
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  ATTACK_MELEE_MAIN_HAND_CONFIG
);
