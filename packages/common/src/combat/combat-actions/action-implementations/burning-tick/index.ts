import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { BURNING_TICK_STEPS_CONFIG } from "./burning-tick-steps-config.js";

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies",
  origin: CombatActionOrigin.TriggeredCondition,
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getOnUseMessage: (data) => {
    return `${data.nameOfTarget} is burning`;
  },
  getOnUseMessageData(context) {
    return {};
  },
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
  hitOutcomeProperties: {
    ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
    getIsBlockable: () => false,
    getHpChangeProperties: (user, _primaryTarget) => {
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

      baseValues.floor();

      return hpChangeProperties;
    },
  },
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
  stepsConfig: BURNING_TICK_STEPS_CONFIG,
  shouldExecute: () => true,
  getConcurrentSubActions: () => [],
  getChildren: () => [],
  getParent: () => null,
};

export const BURNING_TICK = new CombatActionLeaf(CombatActionName.BurningTick, config);
