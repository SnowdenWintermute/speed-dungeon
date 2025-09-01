import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatantEquipment } from "../../../../combatants/index.js";
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
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

export const ATTACK_CONFIG: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  origin: CombatActionOrigin.Attack,
  targetingProperties,
  // placeholder since all this action does is get children
  hitOutcomeProperties: GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Melee],
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    requiresCombatTurnInThisContext: () => false,
  },
  getOnUseMessage: null,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getChildren: function (
      context: ActionResolutionStepContext,
      self: CombatActionComponent
    ): CombatActionComponent[] {
      const toReturn: CombatActionComponent[] = [];
      const user = context.combatantContext.combatant.combatantProperties;

      if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(user))
        toReturn.push(ATTACK_RANGED_MAIN_HAND);
      else {
        toReturn.push(ATTACK_MELEE_MAIN_HAND);
        if (!ATTACK_MELEE_MAIN_HAND.costProperties.requiresCombatTurnInThisContext(context, self))
          toReturn.push(ATTACK_MELEE_OFF_HAND);
      }

      return toReturn;
    },
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
