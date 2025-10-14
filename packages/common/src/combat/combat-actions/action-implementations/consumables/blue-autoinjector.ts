import {
  CombatActionGameLogProperties,
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
import { ConsumableType } from "../../../../items/consumables/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
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
  [CombatActionResource.Mana]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
    let mpBioavailability = 1;

    const { inherentTraitLevels } = primaryTarget.abilityProperties.traitProperties;

    const traitBioavailabilityPercentageModifier =
      (inherentTraitLevels[CombatantTraitType.MpBioavailability] || 0) *
        BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL +
      100;

    mpBioavailability = traitBioavailabilityPercentageModifier / 100;

    const maxMp = CombatantProperties.getTotalAttributes(primaryTarget)[CombatAttribute.Mp];
    const minRestored = Math.max(1, (mpBioavailability * maxMp) / 8);
    const maxRestored = Math.max(1, (mpBioavailability * 3 * maxMp) / 8);

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
};

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  getConsumableCost: () => {
    return { type: ConsumableType.MpAutoinjector, level: 1 };
  },
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE;
const hitOutcomeProperties = createHitOutcomeProperties(base, hitOutcomeOverrides);

const config: CombatActionComponentConfig = {
  description: "Refreshes a target's mana reserves",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Medication,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} uses a blue autoinjector.`;
    },
  }),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_FRIENDLY(),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.CONSUMABLE_USE(),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const USE_BLUE_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseBlueAutoinjector,
  config
);
