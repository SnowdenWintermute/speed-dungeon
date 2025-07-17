import cloneDeep from "lodash.clonedeep";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { BurningCombatantCondition } from "../../../../combatants/combatant-conditions/burning.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatActionName } from "../../combat-action-names.js";

export const FIRE_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Spell],
  getHpChangeProperties: (user, _primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Magical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(4, 8);

    // just get some extra damage for combatant level
    baseValues.add(user.level - 1);
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

  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;

    const fireLevel = combatant.combatantProperties.ownedActions[CombatActionName.Fire]?.level || 0;

    const condition = new BurningCombatantCondition(
      idGenerator.generate(),
      {
        entityProperties: cloneDeep(combatant.entityProperties),
        friendOrFoe: FriendOrFoe.Hostile,
      },
      fireLevel
    );

    return [condition];
  },
};
