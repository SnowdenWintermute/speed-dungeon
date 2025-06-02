import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  Equipment,
  EquipmentSlotType,
  HoldableSlotType,
} from "../../../../items/equipment/index.js";
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
import { COUNTER_ATTACK_MELEE_MAIN_HAND } from "./counter-attack-melee-main-hand.js";
import { COUNTER_ATTACK_RANGED_MAIN_HAND } from "./counter-attack-ranged-main-hand.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

// counterattack action
// copy most from attack
// remove running animation phase
// add parry animation phase
// increase animation speed

const config: CombatActionComponentConfig = {
  description: "Cancel an incoming attack and respond with one of your own",
  origin: CombatActionOrigin.Attack,
  targetingProperties,
  // placeholder since all this action does is get children
  hitOutcomeProperties: GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  shouldExecute: () => true,
  getChildren: function (context: ActionResolutionStepContext): CombatActionComponent[] {
    const toReturn: CombatActionComponent[] = [];
    const user = context.combatantContext.combatant.combatantProperties;

    if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(user))
      toReturn.push(COUNTER_ATTACK_RANGED_MAIN_HAND);
    else toReturn.push(COUNTER_ATTACK_MELEE_MAIN_HAND);

    return toReturn;
  },
  getParent: () => null,
  getRequiredRange: function (
    user: CombatantProperties,
    self: CombatActionComponent
  ): CombatActionRequiredRange {
    throw new Error("this action should never be asked for its required range");
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineChildActions]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),
};

export const COUNTER_ATTACK = new CombatActionComposite(CombatActionName.Counterattack, config);
