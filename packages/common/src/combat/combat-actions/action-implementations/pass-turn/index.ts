import {
  CombatActionComponentConfig,
  CombatActionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  CombatActionUsabilityContext,
  TargetCategories,
} from "../../index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { genericCombatActionCostProperties } from "../../combat-action-cost-properties.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import { getNonProjectileBasedSpellBaseStepsConfig } from "../non-projectile-based-spell-base-steps-config.js";

export const passTurnConfig: CombatActionComponentConfig = {
  description: "Skip your own turn",
  origin: CombatActionOrigin.SpellCast,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle],
    validTargetCategories: TargetCategories.User,
    usabilityContext: CombatActionUsabilityContext.InCombat,
    intent: CombatActionIntent.Benevolent,
  },

  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} passes their turn`;
  },
  hitOutcomeProperties:
    GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
  costProperties: genericCombatActionCostProperties,
  stepsConfig: getNonProjectileBasedSpellBaseStepsConfig(),
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const PASS_TURN = new CombatActionLeaf(CombatActionName.PassTurn, passTurnConfig);
