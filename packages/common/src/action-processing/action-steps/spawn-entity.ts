import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommandType, SpawnEntityGameUpdateCommand } from "../game-update-commands.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import cloneDeep from "lodash.clonedeep";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";

export class SpawnEntityActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(stepType);
    if (!stepConfig) throw new Error("expected step config not found");
    const { getSpawnableEntity } = stepConfig;
    if (!getSpawnableEntity) {
      const message = `no spawnable entity for this step ${COMBAT_ACTION_NAME_STRINGS[action.name]} ${ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType]}`;
      throw new Error(message);
    }

    const taggedSpawnableEntity = getSpawnableEntity(context);

    const { game, party } = context.combatantContext;
    const battleOption = context.combatantContext.getBattleOption();

    switch (taggedSpawnableEntity.type) {
      case SpawnableEntityType.Combatant:
        throw new Error("not yet implemeneted");
      case SpawnableEntityType.ActionEntity:
        AdventuringParty.registerActionEntity(
          party,
          taggedSpawnableEntity.actionEntity,
          battleOption
        );
    }

    context.tracker.spawnedEntityOption = taggedSpawnableEntity;

    const gameUpdateCommand: SpawnEntityGameUpdateCommand = {
      type: GameUpdateCommandType.SpawnEntity,
      step: stepType,
      actionName: context.tracker.actionExecutionIntent.actionName,
      completionOrderId: null,
      entity: cloneDeep(taggedSpawnableEntity),
    };

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion = () => 0;

  protected getBranchingActions = () => [];
}
