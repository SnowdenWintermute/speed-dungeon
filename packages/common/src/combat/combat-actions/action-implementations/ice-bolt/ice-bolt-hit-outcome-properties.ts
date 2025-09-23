import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
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
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";
import { CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";

const spellLevelHpChangeValueModifier = 0.75;

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};

hitOutcomeOverrides.resourceChangePropertiesGetters = {
  // @REFACTOR - combine with common spell hit outcome properties or "projectile spell" properties
  [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Magical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Ice,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(4, 8);

    // just get some extra damage for combatant level
    baseValues.add(user.getLevel() - 1);

    baseValues.mult(1 + spellLevelHpChangeValueModifier * (actionLevel - 1));

    // get greater benefits from a certain attribute the higher level a combatant is
    addCombatantLevelScaledAttributeToRange({
      range: baseValues,
      userTotalAttributes: user.getTotalAttributes(),
      userLevel: user.getLevel(),
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
      conditionName: CombatantConditionName.PrimedForIceBurst,
      level: actionLevel,
      stacks: 1,
      appliedBy: { entityProperties: user.getEntityProperties(), friendOrFoe: FriendOrFoe.Hostile },
    },
  ];
};

export const ICE_BOLT_PROJECTILE_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.RANGED_ACTION,
  hitOutcomeOverrides
);
