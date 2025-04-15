import {
  ActionPayableResource,
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import {
  CombatantProperties,
  CombatantProperties,
  CombatantTraitType,
} from "../../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "../ranged-action-destination-getters.js";
import { COMMON_CHILD_ACTION_STEPS_SEQUENCE } from "../common-action-steps-sequence.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
import { CONSUMABLE_COMMON_CONFIG } from "./consumable-common-config.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { randBetween } from "../../../../utils/index.js";

const config: CombatActionComponentConfig = {
  ...CONSUMABLE_COMMON_CONFIG,
  description: "Restore hit points to a target",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Friendly,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.All,
  intent: CombatActionIntent.Benevolent,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.FullMana,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {
    [ActionPayableResource.QuickActions]: {
      base: 1,
    },
  },
  getResourceCosts: () => null,
  getConsumableCost: () => ConsumableType.MpAutoinjector,
  requiresCombatTurn: (context) => false,
  shouldExecute: () => true,
  getHpChangeProperties: (user, primaryTarget, self) => null,

  getManaChanges: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties,
    self: CombatActionComponent
  ) => {
    let mpBioavailability = 1;
    for (const trait of primaryTarget.traits) {
      if (trait.type === CombatantTraitType.MpBioavailability)
        mpBioavailability = trait.percent / 100;
    }
    const maxMp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Mp];
    if (primaryTarget.mana === maxMp)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ALREADY_FULL_MP);
    const minRestored = (mpBioavailability * maxMp) / 8;
    const maxRestored = (mpBioavailability * 3 * maxMp) / 8;
    const manaChange = Math.max(1, randBetween(minRestored, maxRestored));
  },
  getAppliedConditions: (context) => null,
  getChildren: () => [],
  getParent: () => null,
  userShouldMoveHomeOnComplete: true,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    return {
      type: ActionAccuracyType.Unavoidable,
    };
  },

  getIsParryable: (user: CombatantProperties) => false,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => false,
  getCritChance: function (user: CombatantProperties): number {
    return 0;
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return 0;
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return 0;
  },
  getResolutionSteps: () => COMMON_CHILD_ACTION_STEPS_SEQUENCE,
  motionPhasePositionGetters: RANGED_ACTION_DESTINATION_GETTERS,
};

export const USE_BLUE_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseBlueAutoinjector,
  config
);
