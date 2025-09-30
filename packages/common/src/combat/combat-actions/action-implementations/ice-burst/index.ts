import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  TargetCategories,
} from "../../index.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  AutoTargetingScheme,
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/index.js";
import { BASE_EXPLOSION_RADIUS } from "../../../../app-consts.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { ICE_BURST_PARENT_STEPS_CONFIG } from "./ice-burst-parent-steps-config.js";
import { ActionIntentAndUser } from "../../../../action-processing/index.js";
import { COMBAT_ACTIONS } from "../index.js";
import { EntityId } from "../../../../primatives/index.js";

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

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
  { getThreatChangesOnHitOutcomes: () => null }
);

const config: CombatActionComponentConfig = {
  description: "Deals kinetic ice damage in an area around the target",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => `${data.nameOfActionUser} shatters!`,
  }),
  targetingProperties,
  hitOutcomeProperties,
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
          explosionEntity.actionEntity.getLevel(),
          targetsToSend
        ),
        user: explosionEntity.actionEntity,
      };

      return [actionIntentAndUser];
    },
  },
};

export const ICE_BURST_PARENT = new CombatActionComposite(CombatActionName.IceBurstParent, config);
