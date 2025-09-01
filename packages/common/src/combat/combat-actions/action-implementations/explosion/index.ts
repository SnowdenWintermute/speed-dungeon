import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
  TargetCategories,
} from "../../index.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import {
  AnimationType,
  BASE_EXPLOSION_RADIUS,
  DynamicAnimationName,
} from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { explosionHitOutcomeProperties } from "./explosion-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import cloneDeep from "lodash.clonedeep";
import { AutoTargetingScheme, CombatActionTargetType } from "../../../targeting/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";

const targetingProperties = {
  ...cloneDeep(GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]),
  prohibitedHitCombatantStates: [ProhibitedTargetCombatantStates.Dead],
};
targetingProperties.autoTargetSelectionMethod = {
  scheme: AutoTargetingScheme.WithinRadiusOfEntity,
  radius: BASE_EXPLOSION_RADIUS,
  validTargetCategories: TargetCategories.Any,
};

targetingProperties.shouldExecute = DAMAGING_ACTIONS_COMMON_CONFIG.shouldExecute;

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_ENTITY();
stepsConfig.steps[ActionResolutionStepType.OnActivationSpawnEntity] = {
  ...stepsConfig.steps[ActionResolutionStepType.OnActivationSpawnEntity],
  getSpawnableEntity: (context) => {
    const { party, combatant: user } = context.combatantContext;

    // use some symantic coupling "oh no, bad practice!" to
    // get the target location instead of trying to use auto target
    // since the action's auto target gives a list of ids and we only
    // want to spawn the explosion on the one selected by the user
    const actionTarget = user.combatantProperties.combatActionTarget;
    if (!actionTarget)
      throw new Error("expected shimmed condition action user to have a target set");
    if (actionTarget.type !== CombatActionTargetType.Single)
      throw new Error("expected shimmed condition action user to have a single target");
    const primaryTargetResult = AdventuringParty.getCombatant(party, actionTarget.targetId);
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;

    const position = primaryTargetResult.combatantProperties.position;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "explosion" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Explosion,
        },
      },
    };
  },
};

stepsConfig.steps[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  ...stepsConfig.steps[ActionResolutionStepType.OnActivationActionEntityMotion],
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
      // timing: { type: AnimationTimingType.Timed, duration: 1200 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
};

stepsConfig.steps[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  ...stepsConfig.steps[ActionResolutionStepType.ActionEntityDissipationMotion],
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
      // timing: { type: AnimationTimingType.Timed, duration: 700 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
};

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage in an area around the target",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} explodes!`;
    },
  }),

  hitOutcomeProperties: explosionHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
    getEndsTurnOnUse: () => false,
    requiresCombatTurnInThisContext: () => false,
  },
  stepsConfig,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const EXPLOSION = new CombatActionComposite(CombatActionName.Explosion, config);
