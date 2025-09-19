import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.getArmorPenetration = (user, self) => 15;
hitOutcomeOverrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const stacks = user.asShimmedUserOfTriggeredCondition?.condition.stacksOption?.current || 1;

    const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
export const EXPLOSION_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  base,
  hitOutcomeOverrides
);
