import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  CombatActionResource,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { PrimedForIceBurstCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-ice-burst.js";
import cloneDeep from "lodash.clonedeep";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatantConditionName } from "../../../../combatants/index.js";

const spellLevelHpChangeValueModifier = 0.75;

export const iceBoltProjectileHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Ranged],
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, actionLevel, primaryTarget) => {
      const hpChangeSourceConfig: ResourceChangeSourceConfig = {
        category: ResourceChangeSourceCategory.Magical,
        kineticDamageTypeOption: null,
        elementOption: MagicalElement.Ice,
        isHealing: false,
        lifestealPercentage: null,
      };

      const baseValues = new NumberRange(4, 8);

      // just get some extra damage for combatant level
      baseValues.add(user.level - 1);

      baseValues.mult(1 + spellLevelHpChangeValueModifier * (actionLevel - 1));

      // get greater benefits from a certain attribute the higher level a combatant is
      addCombatantLevelScaledAttributeToRange({
        range: baseValues,
        combatantProperties: user,
        attribute: CombatAttribute.Intelligence,
        normalizedAttributeScalingByCombatantLevel: 1,
      });

      const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
      const hpChangeProperties: CombatActionResourceChangeProperties = {
        resourceChangeSource,
        baseValues,
      };

      baseValues.floor();

      return hpChangeProperties;
    },
  },

  getAppliedConditions: (user, actionLevel) => {
    return [
      {
        conditionName: CombatantConditionName.PrimedForIceBurst,
        level: actionLevel,
        stacks: 1,
        appliedBy: { entityProperties: user.entityProperties, friendOrFoe: FriendOrFoe.Hostile },
      },
    ];
  },
};
