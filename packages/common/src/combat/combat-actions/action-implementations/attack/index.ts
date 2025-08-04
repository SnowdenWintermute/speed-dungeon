import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ATTACK_MELEE_MAIN_HAND } from "./attack-melee-main-hand.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { ATTACK_MELEE_OFF_HAND } from "./attack-melee-off-hand.js";
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

export const ATTACK_CONFIG: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  origin: CombatActionOrigin.Attack,
  targetingProperties,
  // placeholder since all this action does is get children
  hitOutcomeProperties: GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    requiresCombatTurn: () => false,
  },
  shouldExecute: () => true,
  getOnUseMessage: null,
  getChildren: function (context: ActionResolutionStepContext): CombatActionComponent[] {
    const toReturn: CombatActionComponent[] = [];
    const user = context.combatantContext.combatant.combatantProperties;

    if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(user))
      toReturn.push(ATTACK_RANGED_MAIN_HAND);
    else {
      toReturn.push(ATTACK_MELEE_MAIN_HAND);
      if (!ATTACK_MELEE_MAIN_HAND.costProperties.requiresCombatTurn(context))
        toReturn.push(ATTACK_MELEE_OFF_HAND);
    }

    return toReturn;
  },
  getParent: () => {
    return null;
  },
  getRequiredRange: function (
    user: CombatantProperties,
    self: CombatActionComponent
  ): CombatActionRequiredRange {
    throw new Error("this action should never be asked for its required range");
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.DetermineChildActions]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, ATTACK_CONFIG);
