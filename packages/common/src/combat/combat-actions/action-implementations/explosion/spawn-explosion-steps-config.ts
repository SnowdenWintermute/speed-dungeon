import {
  ActionEntity,
  ActionEntityName,
  ActionEntityProperties,
} from "../../../../action-entities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { MaxAndCurrent } from "../../../../primatives/max-and-current.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepsOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepsOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  //@REFACTOR - spawn explosion factory and combine it with spawn ice burst action
  getSpawnableEntities: (context) => {
    const { party, actionUser } = context.actionUserContext;

    const actionTarget = actionUser.getConditionAppliedTo();
    const primaryTarget = party.combatantManager.getExpectedCombatant(actionTarget);

    const position = primaryTarget.combatantProperties.transformProperties.position.clone();

    const entityProperties = { id: context.idGenerator.generate(), name: "explosion" };
    const actionEntityProperties: ActionEntityProperties = {
      position,
      name: ActionEntityName.Explosion,
      actionOriginData: {
        spawnedBy: actionUser.getConditionAppliedBy().entityProperties,
        stacks: actionUser.getConditionStacks(),
        actionLevel: new MaxAndCurrent(actionUser.getLevel(), actionUser.getLevel()),
      },
    };

    return [
      {
        type: SpawnableEntityType.ActionEntity,
        actionEntity: new ActionEntity(entityProperties, actionEntityProperties),
      },
    ];
  },
};

const base = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.EXPLOSION_PARENT;
export const SPAWN_EXPLOSION_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepsOverrides,
});
