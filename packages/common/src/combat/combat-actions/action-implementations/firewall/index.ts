import cloneDeep from "lodash.clonedeep";
import { AbilityType } from "../../../../abilities/ability-types.js";
import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  createGenericSpellCastMessageProperties,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { createHitOutcomeProperties } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { FIREWALL_BURN_HIT_OUTCOME_PROPERTIES } from "./firewall-burn-hit-outcome-properties.js";
import { FIREWALL_STEPS_CONFIG, getFirewallStacksByLevel } from "./firewall-steps-config.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import {
  ActionEntity,
  ActionEntityActionOriginData,
  ActionEntityName,
} from "../../../../action-entities/index.js";

// clone burn hit outcomes for the action description
// and add an on use trigger to change the stacks/level of an existing firewall
const hitOutcomeProperties = createHitOutcomeProperties(
  () => cloneDeep(FIREWALL_BURN_HIT_OUTCOME_PROPERTIES),
  {
    getOnUseTriggers: (context) => {
      const { combatantContext } = context;
      const { game, party, combatant } = combatantContext;
      // check for existing firewall
      const existingFirewallOption = AdventuringParty.getExistingActionEntityOfType(
        party,
        ActionEntityName.Firewall
      );

      // newly spawned firewalls shouldn't be modified here
      // if they are newly spawned they will not exist in this steps since
      // the SpawnActionEntity step comes after OnUseTriggers
      if (existingFirewallOption === null) return {};
      const existingFirewall = existingFirewallOption;
      const { actionOriginData } = existingFirewall.actionEntityProperties;
      if (actionOriginData === undefined)
        throw new Error("expected firewall to have action origin data");

      const actionEntityChanges: Partial<ActionEntityActionOriginData> = {};

      const castedLevel = context.tracker.actionExecutionIntent.level;

      // add stacks equal to the casted level's stacks
      const stacksToAdd = getFirewallStacksByLevel(castedLevel);

      const currentStacks = actionOriginData.stacks?.current || 0;
      const newStacks = Math.max(0, currentStacks + stacksToAdd);
      ActionEntity.setStacks(existingFirewall, newStacks);

      actionEntityChanges.stacks = actionOriginData.stacks;

      // if casting same or higher level, replace the entity's level and combat attributes
      const existingFirewallLevel = actionOriginData.actionLevel;

      // if (castedLevel >= existingFirewallLevel) {
      //   const newActionLevel = Math.min(currentFirewallLevel, newStacks);
      //   ActionEntity.setLevel(existingFirewall, newActionLevel);
      // }

      return {
        actionEntityChanges: { [existingFirewall.entityProperties.id]: actionEntityChanges },
      };
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage to any combatant that passes through the area",
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Fire }],
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.AREA_FRIENDLY(),
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.Firewall),
  }),

  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL(),
  stepsConfig: FIREWALL_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIREWALL = new CombatActionComposite(CombatActionName.Firewall, config);
