import cloneDeep from "lodash.clonedeep";
import { AbilityType } from "../../../../abilities/ability-types.js";
import {
  CombatActionGameLogProperties,
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
      const { actionUserContext } = context;
      const { game, party, actionUser } = actionUserContext;
      // check for existing firewall
      const { actionEntityManager } = party;
      const existingFirewallOption = actionEntityManager.getExistingActionEntityOfType(
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

      const castedLevel = context.tracker.actionExecutionIntent.rank;

      // add stacks equal to the casted level's stacks
      const stacksToAdd = getFirewallStacksByLevel(castedLevel);

      const currentStacks = actionOriginData.stacks?.current || 0;
      const newStacks = Math.max(0, currentStacks + stacksToAdd);
      ActionEntity.setStacks(existingFirewall, newStacks);

      actionEntityChanges.stacks = actionOriginData.stacks;

      // if casting same or higher level, replace the entity's level and combat attributes
      const existingFirewallLevel = actionOriginData.actionLevel;
      const unexpectedUndefinedFirewallLevel = existingFirewallLevel === undefined;
      if (unexpectedUndefinedFirewallLevel) console.warn("unexpectedUndefinedFirewallLevel");

      if (unexpectedUndefinedFirewallLevel || castedLevel >= existingFirewallLevel.current) {
        const newActionLevel = castedLevel;
        ActionEntity.setLevel(existingFirewall, newActionLevel);
        actionEntityChanges.actionLevel = actionOriginData.actionLevel;

        const newAttributes = actionUser.getTotalAttributes();
        actionOriginData.userCombatantAttributes = newAttributes;
        actionEntityChanges.userCombatantAttributes = newAttributes;
      }

      return {
        actionEntityChanges: { [existingFirewall.entityProperties.id]: actionEntityChanges },
      };
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage to any combatant that passes through the area",
  byRankDescriptions: {
    [1]: "",
    [2]: "Ignites certain projectiles that pass through the firewall, changing their element to fire",
    [3]: "Incinerates certain projectiles that pass through the firewall, stopping them from hitting their targets",
  },
  prerequisiteAbilities: [{ type: AbilityType.Action, actionName: CombatActionName.Fire }],
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME(),
  gameLogMessageProperties: new CombatActionGameLogProperties({
    ...createGenericSpellCastMessageProperties(CombatActionName.Firewall),
  }),

  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_SPELL(),
  stepsConfig: FIREWALL_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIREWALL = new CombatActionComposite(CombatActionName.Firewall, config);
