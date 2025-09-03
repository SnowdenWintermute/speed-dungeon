import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
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
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const spellLevelHpChangeValueModifier = 0.5;

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, _primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Magical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(4, 8);
    // const baseValues = new NumberRange(50, 80); // testing
    baseValues.mult(1 + spellLevelHpChangeValueModifier * (actionLevel - 1));

    // just get some extra damage for combatant level
    baseValues.add(user.level - 1);
    // get greater benefits from a certain attribute the higher level a combatant is
    addCombatantLevelScaledAttributeToRange({
      range: baseValues,
      combatantProperties: user,
      attribute: CombatAttribute.Spirit,
      normalizedAttributeScalingByCombatantLevel: 1,
    });

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    baseValues.floor(1);

    return hpChangeProperties;
  },
};

hitOutcomeOverrides.getAppliedConditions = (user, actionLevel) => {
  return [
    {
      conditionName: CombatantConditionName.Burning,
      level: actionLevel,
      stacks: actionLevel * 3,
      appliedBy: { entityProperties: user.entityProperties, friendOrFoe: FriendOrFoe.Hostile },
    },
  ];
};

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL;
export const FIRE_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(base, hitOutcomeOverrides);
