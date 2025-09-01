import {
  CombatActionCombatLogProperties,
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
  CombatActionHitOutcomeProperties,
  CombatActionResource,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { getMeleeAttackBaseStepsConfig } from "./base-melee-attack-steps-config.js";
import { COMBAT_ACTIONS } from "../index.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  addsPropertiesFromHoldableSlot: HoldableSlotType.MainHand,

  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, actionLevel, primaryTarget) => {
      const hpChangeProperties = getAttackResourceChangeProperties(
        hitOutcomeProperties,
        user,
        actionLevel,
        primaryTarget,
        CombatAttribute.Strength
      );
      if (hpChangeProperties instanceof Error) return hpChangeProperties;
      return hpChangeProperties;
    },
  },
};

export const ATTACK_MELEE_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using equipment in main hand",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent],
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnHit },
    },
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
  },
  hitOutcomeProperties,
  stepsConfig: getMeleeAttackBaseStepsConfig(HoldableSlotType.MainHand),

  hierarchyProperties: { ...BASE_ACTION_HIERARCHY_PROPERTIES, getParent: () => ATTACK },
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeMainhand,
  ATTACK_MELEE_MAIN_HAND_CONFIG
);
