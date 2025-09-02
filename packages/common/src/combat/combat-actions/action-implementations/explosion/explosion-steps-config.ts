import { ActionEntityName } from "../../../../action-entities/index.js";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { AnimationType, DynamicAnimationName } from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { CombatActionTargetType } from "../../../targeting/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepsOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepsOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
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

stepsOverrides[ActionResolutionStepType.OnActivationActionEntityMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
      // timing: { type: AnimationTimingType.Timed, duration: 1200 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
};

stepsOverrides[ActionResolutionStepType.ActionEntityDissipationMotion] = {
  getAnimation: () => {
    return {
      name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
      // timing: { type: AnimationTimingType.Timed, duration: 700 },
      timing: { type: AnimationTimingType.Timed, duration: 200 },
      smoothTransition: false,
    };
  },
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_ENTITY;
export const EXPLOSION_STEPS_CONFIG = createStepsConfig(base, { steps: stepsOverrides });
