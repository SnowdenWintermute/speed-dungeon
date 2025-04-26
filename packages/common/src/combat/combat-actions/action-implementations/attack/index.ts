import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack-melee-main-hand.js";
import {
  Equipment,
  EquipmentSlotType,
  HoldableSlotType,
} from "../../../../items/equipment/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack-melee-off-hand.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesGenericTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  usabilityContext: CombatActionUsabilityContext.InCombat,
  targetingProperties,
  // placeholder since all this action does is get children
  hitOutcomeProperties:
    GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesGenericTypes.Melee],
  intent: CombatActionIntent.Malicious,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => null,
  getChildren: function (context: ActionResolutionStepContext): CombatActionComponent[] {
    const toReturn: CombatActionComponent[] = [];
    const user = context.combatantContext.combatant.combatantProperties;
    const mainHandEquipmentOption = CombatantEquipment.getEquipmentInSlot(user, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });
    if (
      mainHandEquipmentOption &&
      !Equipment.isBroken(mainHandEquipmentOption) &&
      Equipment.isRangedWeapon(mainHandEquipmentOption)
    ) {
      toReturn.push(ATTACK_RANGED_MAIN_HAND);
    } else {
      toReturn.push(ATTACK_MELEE_MAIN_HAND);
      if (!ATTACK_MELEE_MAIN_HAND.requiresCombatTurn(context)) toReturn.push(ATTACK_MELEE_OFF_HAND);
      // const specialExtra = ATTACK_MELEE_MAIN_HAND;
      // if (specialExtra) toReturn.push(specialExtra);
    }
    return toReturn;
  },
  getParent: () => {
    console.log("tried to get parent for attack");
    return null;
  },
  getRequiredRange: function (
    user: CombatantProperties,
    self: CombatActionComponent
  ): CombatActionRequiredRange {
    // @TODO - determine based on children
    throw new Error("Function not implemented.");
  },
  getResolutionSteps: () => [ActionResolutionStepType.DetermineChildActions],
  motionPhasePositionGetters: {},
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, config);
