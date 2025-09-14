import { ActionEntity } from "../../../../action-entities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { throwIfError } from "../../../../utils/index.js";
import {
  ActionResolutionStepsConfig,
  CombatActionCombatLogProperties,
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
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
  {
    getOnUseTriggers: (context) => {
      const { combatantContext } = context;
      const { game, party, combatant } = combatantContext;
      // check for existing firewall
      const { asShimmedActionEntity } = combatant.combatantProperties;
      if (asShimmedActionEntity === undefined) {
        throw new Error("expected user to have action entity shim properties");
      }

      const existingFirewall = throwIfError(
        AdventuringParty.getActionEntity(party, asShimmedActionEntity.entityProperties.id)
      );

      // reduce stacks
      const currentStacks =
        existingFirewall.actionEntityProperties.actionOriginData?.stacks?.current || 0;
      const newStacks = Math.max(0, currentStacks - 1);
      ActionEntity.setStacks(existingFirewall, newStacks);

      // set level of existingFirewall to min(existingFirewall.level, existingFirewall.stacks)
      const currentFirewallLevel =
        existingFirewall.actionEntityProperties.actionOriginData?.actionLevel?.current || 0;
      const newActionLevel = Math.min(currentFirewallLevel, newStacks);
      ActionEntity.setLevel(existingFirewall, newActionLevel);

      // if stacks === 0, despawn firewall
      let despawned = false;
      if (newStacks === 0) {
        despawned = true;
        const battleOption = AdventuringParty.getBattleOption(party, game);
        AdventuringParty.unregisterActionEntity(
          party,
          existingFirewall.entityProperties.id,
          battleOption
        );
      }

      if (despawned) {
      }
      // send action entities updated []
      // - action entity id
      // - stack change
      // - level change
      // OR
      // - action entity ids despawned []

      return {};
    },
  }
);

const config: CombatActionComponentConfig = {
  description: "Firewall consumes its fuel",
  prerequisiteAbilities: [],
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME(),
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    getOnUseMessage: (data) => `${data.nameOfActionUser} burns down`,
  }),

  hitOutcomeProperties: HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE(),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
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
