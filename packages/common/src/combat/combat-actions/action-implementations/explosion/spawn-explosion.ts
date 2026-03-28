import { CombatActionComponentConfig, CombatActionComposite } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { SPAWN_EXPLOSION_STEPS_CONFIG } from "./spawn-explosion-steps-config.js";
import { HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ActionRank, EntityId } from "../../../../aliases.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { CombatActionName } from "../../combat-action-names.js";
import { ActionIntentAndUser } from "../../../../action-processing/action-steps/index.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";

const targetingProperties = TARGETING_PROPERTIES_TEMPLATE_GETTERS.EXPLOSION();

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage in an area around the target",
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} explodes!`;
    },
  }),

  hitOutcomeProperties: HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION(),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: SPAWN_EXPLOSION_STEPS_CONFIG,

  hierarchyProperties: {
    getChildren: () => [],
    getParent: () => null,
    getConcurrentSubActions(context) {
      const explosionEntity = context.tracker.getFirstExpectedSpawnedActionEntity();

      const targets = targetingProperties.getAutoTarget(
        context.actionUserContext,
        context.tracker,
        COMBAT_ACTIONS[CombatActionName.SpawnExplosion]
      );

      const targetIds: EntityId[] = [];
      const autoTargetSucceeded = !(targets instanceof Error);
      const targetsWereFound = targets !== null;

      const emptyTarget: CombatActionTarget = {
        type: CombatActionTargetType.DistinctIds,
        targetIds,
      };
      const targetsToSend = autoTargetSucceeded && targetsWereFound ? targets : emptyTarget;

      const actionIntentAndUser: ActionIntentAndUser = {
        actionExecutionIntent: new CombatActionExecutionIntent(
          CombatActionName.ExecuteExplosion,
          explosionEntity.actionEntity.getLevel() as ActionRank,
          targetsToSend
        ),
        user: explosionEntity.actionEntity,
      };

      return [actionIntentAndUser];
    },
  },
};

export const SPAWN_EXPLOSION = new CombatActionComposite(CombatActionName.SpawnExplosion, config);
