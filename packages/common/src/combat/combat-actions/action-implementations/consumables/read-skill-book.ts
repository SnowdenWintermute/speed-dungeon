import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  TargetCategories,
} from "../../index.js";
import {
  BIOAVAILABILITY_PERCENTAGE_BONUS_PER_TRAIT_LEVEL,
  CombatantProperties,
  CombatantTraitType,
} from "../../../../combatants/index.js";
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

const targetingProperties = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle],
  getValidTargetCategories: () => TargetCategories.User,
};

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
};

const config: CombatActionComponentConfig = {
  description: "Refreshes a target's mana reserves",
  origin: CombatActionOrigin.Medication,
  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} reads ${data.}.`;
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
  getRequiredRange: () => CombatActionRequiredRange.Melee,
};

export const READ_SKILL_BOOK = new CombatActionLeaf(CombatActionName.ReadSkillBook, config);
