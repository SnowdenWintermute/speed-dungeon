import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommandType, SpawnEntitiesGameUpdateCommand } from "../game-update-commands.js";
import { COMBAT_ACTIONS, COMBAT_ACTION_NAME_STRINGS } from "../../combat/index.js";
import { SpawnableEntityType } from "../../spawnables/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";

export class SpawnEntitiesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(stepType);
    if (!stepConfig) throw new Error("expected step config not found");
    const { getSpawnableEntities } = stepConfig;
    if (!getSpawnableEntities) {
      const message = `no spawnable entity getter for this step ${COMBAT_ACTION_NAME_STRINGS[action.name]} ${ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType]}`;
      throw new Error(message);
    }

    let gameUpdateCommand: SpawnEntitiesGameUpdateCommand | null = null;

    const taggedSpawnableEntitiesOption = getSpawnableEntities(context);
    if (taggedSpawnableEntitiesOption !== null) {
      const taggedSpawnableEntities = taggedSpawnableEntitiesOption;

      const { game, party } = context.actionUserContext;
      const battleOption = AdventuringParty.getBattleOption(party, game);

      for (const spawnableEntity of taggedSpawnableEntities) {
        switch (spawnableEntity.type) {
          case SpawnableEntityType.Combatant:
            throw new Error("not yet implemeneted");
          case SpawnableEntityType.ActionEntity:
            AdventuringParty.registerActionEntity(
              party,
              spawnableEntity.actionEntity,
              battleOption
            );
        }

        context.tracker.spawnedEntities.push(spawnableEntity);
      }

      gameUpdateCommand = {
        type: GameUpdateCommandType.SpawnEntities,
        step: stepType,
        actionName: context.tracker.actionExecutionIntent.actionName,
        completionOrderId: null,
        entities: taggedSpawnableEntities,
      };
    }

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion = () => 0;

  protected getBranchingActions = () => [];
}
