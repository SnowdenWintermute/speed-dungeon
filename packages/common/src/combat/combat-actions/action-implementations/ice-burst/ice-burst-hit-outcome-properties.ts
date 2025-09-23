import cloneDeep from "lodash.clonedeep";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { KineticDamageType } from "../../../kinetic-damage-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { CombatantCondition, CombatantConditionName } from "../../../../combatants/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { FriendOrFoe } from "../../targeting-schemes-and-categories.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.getArmorPenetration = (user, actionLevel, self) => 15;
hitOutcomeOverrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: KineticDamageType.Piercing,
      elementOption: MagicalElement.Ice,
      isHealing: false,
      lifestealPercentage: null,
    };

    let stacks = 1;
    if (user instanceof CombatantCondition) stacks = user.stacksOption?.current || 1;

    const userLevel = user.getLevel();

    const baseValues = new NumberRange(userLevel * stacks, userLevel * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },
};

hitOutcomeOverrides.getAppliedConditions = (actionUser, actionlevel) => {
  return [
    {
      conditionName: CombatantConditionName.PrimedForIceBurst,
      level: actionUser.getLevel(),
      stacks: 1,
      appliedBy: actionUser.getConditionAppliedBy(),
    },
  ];
};

export const ICE_BURST_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL,
  hitOutcomeOverrides
);
