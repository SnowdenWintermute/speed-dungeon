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
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  usabilityContext: CombatActionUsabilityContext.InCombat,
  targetingProperties,
  // placeholder since all this action does is get children
  hitOutcomeProperties: GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  intent: CombatActionIntent.Malicious,
  shouldExecute: () => true,
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
      if (!ATTACK_MELEE_MAIN_HAND.costProperties.requiresCombatTurn(context))
        toReturn.push(ATTACK_MELEE_OFF_HAND);
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
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineChildActions]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, config);
