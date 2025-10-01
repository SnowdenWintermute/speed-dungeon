import {
  ActionEntity,
  ActionEntityName,
  ActionEntityProperties,
} from "../../../../action-entities/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { MaxAndCurrent } from "../../../../primatives/max-and-current.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { ActionResolutionStepConfig } from "../../combat-action-steps-config.js";
import {
  ACTION_STEPS_CONFIG_TEMPLATE_GETTERS,
  createStepsConfig,
} from "../generic-action-templates/step-config-templates/index.js";

const stepOverrides: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>> = {};

stepOverrides[ActionResolutionStepType.OnActivationSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const { party, actionUser } = context.actionUserContext;

    const actionTarget = actionUser.getConditionAppliedTo();
    const primaryTargetResult = AdventuringParty.getCombatant(party, actionTarget);
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;

    const position = primaryTargetResult.combatantProperties.position.clone();

    const entityProperties = { id: context.idGenerator.generate(), name: "ice burst" };
    const actionEntityProperties: ActionEntityProperties = {
      position,
      name: ActionEntityName.IceBurst,
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

export const ICE_BURST_PARENT_STEPS_CONFIG = createStepsConfig(base, {
  steps: stepOverrides,
});
