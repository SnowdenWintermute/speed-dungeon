import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { getMeleeAttackBaseStepsConfig } from "./base-melee-attack-steps-config.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { COMBAT_ACTIONS } from "../index.js";

export const ATTACK_MELEE_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using equipment in main hand",
  origin: CombatActionOrigin.Attack,
  getRequiredRange: () => CombatActionRequiredRange.Melee,
  getOnUseMessage: null,
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent],
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnHit },
    },
    requiresCombatTurn: (context) => {
      const user = context.combatantContext.combatant.combatantProperties;

      if (CombatantEquipment.isWearingUsableShield(user)) return true;
      if (CombatantEquipment.isWearingUsableTwoHandedMeleeWeapon(user)) return true;
      if (
        !COMBAT_ACTIONS[CombatActionName.AttackMeleeOffhand].shouldExecute(
          context.combatantContext,
          context.tracker
        )
      )
        return true; // check if offhand should execute, otherwise if we kill an enemy with main hand
      // we won't end our turn
      if (context.tracker.wasCountered()) return true;

      return false;
    },
  },
  hitOutcomeProperties: {
    ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
    addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,
  },
  stepsConfig: getMeleeAttackBaseStepsConfig(HoldableSlotType.MainHand),

  shouldExecute: () => true,
  getChildren: () => [],
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  ATTACK_MELEE_MAIN_HAND_CONFIG
);
