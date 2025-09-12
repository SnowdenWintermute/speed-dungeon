import cloneDeep from "lodash.clonedeep";
import { BURNING_TICK_HIT_OUTCOME_PROPERTIES } from "../burning-tick/burning-tick-hit-outcome-properties.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import { CombatantProperties, CombatAttribute } from "../../../../combatants/index.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { createHitOutcomeProperties } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { CombatActionName } from "../../combat-action-names.js";

const hitOutcomeOverrides: Partial<CombatActionHitOutcomeProperties> = {};
hitOutcomeOverrides.resourceChangePropertiesGetters = {
  [CombatActionResource.HitPoints]: (user, hitOutcomeProperties, actionLevel, primaryTarget) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(2, 5);

    const { userTotalAttributes } = getFirewallBurnUserLevelAndAttributes(user);

    baseValues.add((actionLevel || 1) - 1);

    addCombatantLevelScaledAttributeToRange({
      range: baseValues,
      userTotalAttributes,
      userLevel: actionLevel,
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

export const FIREWALL_BURN_HIT_OUTCOME_PROPERTIES = createHitOutcomeProperties(
  () => cloneDeep(BURNING_TICK_HIT_OUTCOME_PROPERTIES),
  hitOutcomeOverrides
);

function getFirewallBurnUserLevelAndAttributes(user: CombatantProperties) {
  const { asShimmedUserOfTriggeredEnvironmentalHazard } = user;
  if (asShimmedUserOfTriggeredEnvironmentalHazard) {
    const { hazardEntity } = asShimmedUserOfTriggeredEnvironmentalHazard;
    const { actionEntityProperties } = hazardEntity;
    const { actionOriginData } = actionEntityProperties;
    if (!actionOriginData) throw new Error("expected action origin data on firewall action entity");
    const { actionLevel, userCombatantAttributes, userElementalAffinities } = actionOriginData;
    return { userLevel: actionLevel || 1, userTotalAttributes: userCombatantAttributes || {} };
  } else {
    // in the case we're reading the description we won't have an action entity, so we'll directly
    // use the user since that would be the same properties just passed to an action entity when actually
    // calculating hit outcomes
    const spellLevel = user.selectedActionLevel || 1;

    return {
      userLevel: spellLevel,
      userTotalAttributes: CombatantProperties.getTotalAttributes(user),
    };
  }
}
