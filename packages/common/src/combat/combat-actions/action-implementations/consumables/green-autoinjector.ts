import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatantProperties, CombatantTraitType } from "../../../../combatants/index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { randBetween } from "../../../../utils/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ConsumableType } from "../../../../items/consumables/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  GENERIC_HIT_OUTCOME_PROPERTIES,
  ActionHitOutcomePropertiesBaseTypes,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionHitOutcomeProperties } from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { MEDICATION_ACTION_BASE_STEPS_CONFIG } from "./base-consumable-steps-config.js";

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle];

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Medical,
      isHealing: true,
    };

    let hpBioavailability = 1;
    for (const trait of primaryTarget.traits) {
      if (trait.type === CombatantTraitType.HpBioavailability)
        hpBioavailability = trait.percent / 100;
    }

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
};

const config: CombatActionComponentConfig = {
  description: "Restore hit points to a target",
  origin: CombatActionOrigin.Medication,
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Medication],
    getConsumableCost: () => ConsumableType.HpAutoinjector,
  },
  stepsConfig: MEDICATION_ACTION_BASE_STEPS_CONFIG,

  shouldExecute: () => true,

  getChildren: () => [],
  getParent: () => null,

  getRequiredRange: () => CombatActionRequiredRange.Ranged,
};

export const USE_GREEN_AUTOINJECTOR = new CombatActionLeaf(
  CombatActionName.UseGreenAutoinjector,
  config
);
