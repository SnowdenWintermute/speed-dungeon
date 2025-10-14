import { ActionEntity } from "../../../../action-entities/index.js";
import {
  ActionResolutionStepType,
  ActivatedTriggersGameUpdateCommand,
} from "../../../../action-processing/index.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { CleanupMode } from "../../../../types.js";
import {
  ActionResolutionStepsConfig,
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
} from "../../index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { FIREWALL_STEPS_CONFIG } from "./firewall-steps-config.js";

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
  {
    getOnUseTriggers: (context) => {
      const { actionUserContext } = context;
      const { party, actionUser } = actionUserContext;

      // check for existing firewall
      const firewallId = actionUser.getEntityId();
      const { actionEntityManager } = party;
      const existingFirewall = actionEntityManager.getExpectedActionEntity(firewallId);

      const { actionOriginData } = existingFirewall.actionEntityProperties;
      if (actionOriginData === undefined)
        throw new Error("expected firewall to have action origin data");

      // reduce stacks
      const currentStacks = actionOriginData.stacks?.current || 0;
      const newStacks = Math.max(0, currentStacks - 1);
      ActionEntity.setStacks(existingFirewall, newStacks);

      // set level of existingFirewall to min(existingFirewall.level, existingFirewall.stacks)
      const currentFirewallLevel = actionOriginData.actionLevel?.current || 0;

      const newActionLevel = Math.min(currentFirewallLevel, newStacks);
      ActionEntity.setLevel(existingFirewall, newActionLevel);

      const toReturn: Partial<ActivatedTriggersGameUpdateCommand> = {};

      // if stacks === 0, despawn firewall
      let despawned = false;
      if (newStacks === 0) {
        despawned = true;
        actionEntityManager.unregisterActionEntity(firewallId);
      }

      if (despawned) {
        toReturn.actionEntityIdsDespawned = [{ id: firewallId, cleanupMode: CleanupMode.Soft }];
      } else {
        toReturn.actionEntityChanges = {
          [firewallId]: {
            stacks: actionOriginData.stacks,
            actionLevel: actionOriginData.actionLevel,
          },
        };

        // change the cosmetic effect if firewall has deleveled
        if (newActionLevel < currentFirewallLevel) {
          const firewallCosmeticsStepOption =
            FIREWALL_STEPS_CONFIG.steps[ActionResolutionStepType.RecoveryMotion];
          if (!firewallCosmeticsStepOption)
            throw new Error("expected to have configured RecoveryMotion for Firewall");

          // @REFACTOR
          // @BADPRACTICE
          // some symantec coupling - we just want to reuse the cosmetic effect
          // creators from firewall action, which expects its tracker to have a
          // spawned firewall
          context.tracker.spawnedEntities = [
            {
              type: SpawnableEntityType.ActionEntity,
              actionEntity: existingFirewall,
            },
          ];

          const toStopGetter = firewallCosmeticsStepOption.getCosmeticEffectsToStop;
          const toStartGetter = firewallCosmeticsStepOption.getCosmeticEffectsToStart;
          if (!toStartGetter || !toStopGetter)
            throw new Error("expected Firewall to have cosmetic effects configured");

          toReturn.cosmeticEffectsToStop = toStopGetter(context);
          toReturn.cosmeticEffectsToStart = toStartGetter(context);
        }
      }

      return toReturn;
    },
  }
);

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME,
  {
    executionPreconditions: [],
  }
);

const config: CombatActionComponentConfig = {
  description: "Firewall consumes its fuel",
  prerequisiteAbilities: [],
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    getOnUseMessage: (data) => `${data.nameOfActionUser} burns down`,
  }),

  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
    },
    {
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const FIREWALL_PASS_TURN = new CombatActionComposite(
  CombatActionName.FirewallPassTurn,
  config
);
