import {
  CombatActionCombatLogProperties,
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
import { CombatActionResource } from "../../combat-action-hit-outcome-properties.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { BasicRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { randBetween } from "../../../../utils/rand-between.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};

hitOutcomeOverrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
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
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE;
const hitOutcomeProperties = createHitOutcomeProperties(base, hitOutcomeOverrides);

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  getConsumableCost: () => {
    return { type: ConsumableType.HpAutoinjector, level: 1 };
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Restore hit points to a target",
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_FRIENDLY(),
  hitOutcomeProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Medication,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} uses a green autoinjector.`;
    },
  }),
  costProperties,
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.CONSUMABLE_USE(),

  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const USE_GREEN_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseGreenAutoinjector,
  config
);
