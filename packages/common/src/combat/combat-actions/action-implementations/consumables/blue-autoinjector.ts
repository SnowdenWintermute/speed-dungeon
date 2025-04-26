import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatantProperties, CombatantTraitType } from "../../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "../ranged-action-destination-getters.js";
import { COMMON_CHILD_ACTION_STEPS_SEQUENCE } from "../common-action-steps-sequence.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
import { CONSUMABLE_COMMON_CONFIG } from "./consumable-common-config.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { randBetween } from "../../../../utils/index.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
  getManaChangeProperties: (user: CombatantProperties, primaryTarget: CombatantProperties) => {
    let mpBioavailability = 1;
    for (const trait of primaryTarget.traits) {
      if (trait.type === CombatantTraitType.MpBioavailability)
        mpBioavailability = trait.percent / 100;
    }
    const maxMp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Mp];
    const minRestored = (mpBioavailability * maxMp) / 8;
    const maxRestored = (mpBioavailability * 3 * maxMp) / 8;

    const resourceChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Medical,
      isHealing: true,
    };

    const resourceChangeSource = new ResourceChangeSource(resourceChangeSourceConfig);
    const manaChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues: new NumberRange(minRestored, randBetween(minRestored, maxRestored)),
    };
    return manaChangeProperties;
  },
};

const config: CombatActionComponentConfig = {
  ...CONSUMABLE_COMMON_CONFIG,
  description: "Refreshes a target's mana reserves",
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Medication],
    getConsumableCost: () => ConsumableType.MpAutoinjector,
  },

  usabilityContext: CombatActionUsabilityContext.All,
  intent: CombatActionIntent.Benevolent,
  shouldExecute: () => true,
  getChildren: () => [],
  getParent: () => null,
  userShouldMoveHomeOnComplete: true,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,

  getResolutionSteps: () => COMMON_CHILD_ACTION_STEPS_SEQUENCE,
  motionPhasePositionGetters: RANGED_ACTION_DESTINATION_GETTERS,
};

export const USE_BLUE_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseBlueAutoinjector,
  config
);
