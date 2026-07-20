import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
} from "../../index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import {
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
  createTargetingPropertiesConfig,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { THROW_PEBBLE_PARENT_STEPS_CONFIG } from "./throw-pebble-parent-steps-config.js";
import { getAttackResourceChangeProperties } from "../attack/get-attack-resource-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import {
  CombatActionHitOutcomeProperties,
  CombatActionResource,
} from "../../combat-action-hit-outcome-properties.js";
import { IActionUser } from "../../../../action-user-context/action-user.js";
import { CombatantProperties } from "../../../../combatants/combatant-properties.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";
import { ActionRank } from "../../../../aliases.js";

const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
  costsByRank: {
    [1 as ActionRank]: { [ActionPayableResource.ActionPoints]: 2 },
  },
};
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.RANGED_ACTION,
  {
    resourceChangePropertiesGetters: {
      [CombatActionResource.HitPoints]: (
        user: IActionUser,
        hitOutcomeProperties: CombatActionHitOutcomeProperties,
        actionRank: number,
        primaryTargetCombatantProperties: CombatantProperties
      ) =>
        getAttackResourceChangeProperties(
          user,
          hitOutcomeProperties,
          actionRank,
          primaryTargetCombatantProperties,
          CombatAttribute.Dexterity,
          { usableWeaponsOnly: false, forceUnarmed: true }
        ),
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "A weak ranged attack",
  prerequisiteAbilities: [],
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => `${data.nameOfActionUser} throws a pebble at ${data.nameOfTarget}`,
  }),
  targetingProperties: createTargetingPropertiesConfig(
    TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
    {}
  ),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: THROW_PEBBLE_PARENT_STEPS_CONFIG,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getConcurrentSubActions(context) {
      const expectedProjectile = context.tracker.getFirstExpectedSpawnedActionEntity();

      const { rank, targets } = context.tracker.actionExecutionIntent;

      return [
        {
          user: expectedProjectile.actionEntity,
          actionExecutionIntent: new CombatActionExecutionIntent(
            CombatActionName.ThrowPebbleProjectile,
            rank,
            targets
          ),
        },
      ];
    },
  },
};

export const THROW_PEBBLE_PARENT = new CombatActionLeaf(CombatActionName.ThrowPebbleParent, config);
