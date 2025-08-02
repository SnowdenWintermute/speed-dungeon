import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatantProperties, CombatantTraitType } from "../../../../combatants/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
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
  CombatActionResource,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { MEDICATION_ACTION_BASE_STEPS_CONFIG } from "./base-consumable-steps-config.js";
import { BasicRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
  resourceChangePropertiesGetters: {
    [CombatActionResource.Mana]: (
      user: CombatantProperties,
      primaryTarget: CombatantProperties
    ) => {
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
        baseValues: new NumberRange(
          minRestored,
          randBetween(minRestored, maxRestored, new BasicRandomNumberGenerator())
        ),
      };
      return manaChangeProperties;
    },
  },
};

const config: CombatActionComponentConfig = {
  description: "Refreshes a target's mana reserves",
  origin: CombatActionOrigin.Medication,
  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} uses a blue autoinjector.`;
  },
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Medication],
    getConsumableCost: () => ConsumableType.MpAutoinjector,
  },

  stepsConfig: MEDICATION_ACTION_BASE_STEPS_CONFIG,

  shouldExecute: () => true,
  getChildren: () => [],
  getParent: () => null,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
};

export const USE_BLUE_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseBlueAutoinjector,
  config
);
