import { NumberRange } from "../../../../primatives/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const overrides: Partial<CombatActionHitOutcomeProperties> = {};
overrides.getIsBlockable = () => false;

overrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user, _primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(2, 5);

    // just get some extra damage for combatant level
    baseValues.add(user.level - 1);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    baseValues.floor(1);

    return hpChangeProperties;
  },
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
export const BURNING_TICK_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(base, overrides);
