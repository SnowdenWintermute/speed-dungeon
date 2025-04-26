import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";

export const explosionHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
  getArmorPenetration: (user, self) => 15,
  getHpChangeProperties: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const stacks = user.asUserOfTriggeredCondition?.stacksOption?.current || 1;

    const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },
  getAppliedConditions: (context) => {
    // @TODO - apply a "burning" condition
    return null;
  },
};
