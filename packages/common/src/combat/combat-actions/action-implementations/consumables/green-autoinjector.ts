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
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { CombatantProperties, CombatantTraitType } from "../../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "../ranged-action-destination-getters.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { COMMON_CHILD_ACTION_STEPS_SEQUENCE } from "../common-action-steps-sequence.js";
import { randBetween } from "../../../../utils/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
import { CONSUMABLE_COMMON_CONFIG } from "./consumable-common-config.js";

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
    ProhibitedTargetCombatantStates.FullHp,
  ],
  prohibitedHitCombatantStates: [],
  baseResourceChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {
    [ActionPayableResource.QuickActions]: {
      base: 1,
    },
  },
  getResourceCosts: () => null,
  getConsumableCost: () => ConsumableType.HpAutoinjector,
  requiresCombatTurn: (context) => false,
  shouldExecute: () => true,
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Medical,
      isHealing: true,
    };

    let hpBioavailability = 1;
    for (const trait of primaryTarget.traits) {
      if (trait.type === CombatantTraitType.HpBioavailability)
        hpBioavailability = trait.percent / 100;
    }

    console.log("HpBioavailability", hpBioavailability);

    const maxHp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Hp];
    const minHealing = (hpBioavailability * maxHp) / 8;
    const maxHealing = (hpBioavailability * 3 * maxHp) / 8;

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues: new NumberRange(minHealing, randBetween(minHealing, maxHealing)),
    };

    return hpChangeProperties;
  },
  getManaChangeProperties: () => null,
  getAppliedConditions: function (context): CombatantCondition[] | null {
    return null;
  },
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

export const USE_GREEN_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseGreenAutoinjector,
  config
);
