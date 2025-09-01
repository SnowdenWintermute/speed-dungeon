import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL,
  CombatantProperties,
  CombatantTraitType,
} from "../../../../combatants/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  GENERIC_HIT_OUTCOME_PROPERTIES,
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { MEDICATION_ACTION_BASE_STEPS_CONFIG } from "./base-consumable-steps-config.js";
import { BasicRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { randBetween } from "../../../../utils/rand-between.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, actionLevel, primaryTarget) => {
      const hpChangeSourceConfig: ResourceChangeSourceConfig = {
        category: ResourceChangeSourceCategory.Medical,
        isHealing: true,
      };

      let hpBioavailability = 1;

      const { inherentTraitLevels } = primaryTarget.abilityProperties.traitProperties;

      const traitBioavailabilityPercentageModifier =
        (inherentTraitLevels[CombatantTraitType.HpBioavailability] || 0) *
          BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL +
        100;
      hpBioavailability = traitBioavailabilityPercentageModifier / 100;

      const maxHp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Hp];
      const minHealing = (hpBioavailability * maxHp) / 8;
      const maxHealing = (hpBioavailability * 3 * maxHp) / 8;

      const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
      const hpChangeProperties: CombatActionResourceChangeProperties = {
        resourceChangeSource,
        baseValues: new NumberRange(
          minHealing,
          randBetween(minHealing, maxHealing, new BasicRandomNumberGenerator())
        ),
      };

      return hpChangeProperties;
    },
  },
};

const config: CombatActionComponentConfig = {
  description: "Restore hit points to a target",
  origin: CombatActionOrigin.Medication,
  targetingProperties,
  hitOutcomeProperties,
  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} uses a green autoinjector.`;
  },
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Medication],
    getConsumableCost: () => {
      return { type: ConsumableType.HpAutoinjector, level: 1 };
    },
  },
  stepsConfig: MEDICATION_ACTION_BASE_STEPS_CONFIG,

  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const USE_GREEN_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseGreenAutoinjector,
  config
);
