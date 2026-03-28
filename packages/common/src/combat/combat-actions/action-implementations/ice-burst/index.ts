import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { BASE_EXPLOSION_RADIUS } from "../../../../app-consts.js";
import { HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ICE_BURST_PARENT_STEPS_CONFIG } from "./ice-burst-parent-steps-config.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ActionRank, EntityId } from "../../../../aliases.js";
import { TargetCategories } from "../../targeting-schemes-and-categories.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionExecutionIntent } from "../../combat-action-execution-intent.js";
import { CombatActionComponentConfig, CombatActionComposite } from "../../index.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { ActionIntentAndUser } from "../../../../action-processing/action-steps/index.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.EXPLOSION,
  {
    autoTargetSelectionMethod: {
      scheme: AutoTargetingScheme.WithinRadiusOfEntity,
      radius: BASE_EXPLOSION_RADIUS,
      validTargetCategories: TargetCategories.Any,
      excludePrimaryTarget: true,
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Deals kinetic ice damage in an area around the target",
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => `Ice burst shatters!`,
    getOnUseMessageDataOverride: (context) => {
      return {
        actionLevel: 1,
        nameOfActionUser: context.actionUserContext.actionUser.getName(),
        nameOfTarget: "",
      };
    },
  }),
  targetingProperties,
  hitOutcomeProperties: HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION(),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: ICE_BURST_PARENT_STEPS_CONFIG,
  hierarchyProperties: {
    getChildren: () => [],
    getParent: () => null,
    getConcurrentSubActions(context) {
      const explosionEntity = context.tracker.getFirstExpectedSpawnedActionEntity();

      const targets = targetingProperties.getAutoTarget(
        context.actionUserContext,
        context.tracker,
        COMBAT_ACTIONS[CombatActionName.IceBurstParent]
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
          CombatActionName.IceBurstExplosion,
          explosionEntity.actionEntity.getLevel() as ActionRank,
          targetsToSend
        ),
        user: explosionEntity.actionEntity,
      };

      return [actionIntentAndUser];
    },
  },
};

export const ICE_BURST_PARENT = new CombatActionComposite(CombatActionName.IceBurstParent, config);
