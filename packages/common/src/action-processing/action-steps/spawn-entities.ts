import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommandType, SpawnEntitiesGameUpdateCommand } from "../game-update-commands.js";
import { SerializedSpawnableEntity, SpawnableEntityType } from "../../spawnables/index.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";

export class SpawnEntitiesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const stepConfig = action.stepsConfig.getStepConfigOption(stepType);
    if (!stepConfig) throw new Error("expected step config not found");
    const { getSpawnableEntities } = stepConfig;
    if (!getSpawnableEntities) {
      const message = `no spawnable entity getter for this step ${action.getStringName()} ${ACTION_RESOLUTION_STEP_TYPE_STRINGS[stepType]}`;
      throw new Error(message);
    }

    let gameUpdateCommand: SpawnEntitiesGameUpdateCommand | null = null;

    const taggedSpawnableEntitiesOption = getSpawnableEntities(context);
    const serializedSpawnedEntities: { entity: SerializedSpawnableEntity; withDelay?: number }[] =
      [];

    if (taggedSpawnableEntitiesOption !== null) {
      const taggedSpawnableEntities = taggedSpawnableEntitiesOption;

      const { game, party } = context.actionUserContext;
      const battleOption = party.getBattleOption(game);

      for (const spawnableEntity of taggedSpawnableEntities) {
        switch (spawnableEntity.type) {
          case SpawnableEntityType.Combatant: {
            const delay = battleOption?.getSchedulerDelayForNewActionUser();
            party.combatantManager.addCombatant(spawnableEntity.combatant, game, delay);
            serializedSpawnedEntities.push({
              entity: { ...spawnableEntity, combatant: spawnableEntity.combatant.toSerialized() },
              withDelay: delay,
            });
            break;
          }
          case SpawnableEntityType.ActionEntity: {
            const { actionEntityManager } = party;
            actionEntityManager.registerActionEntity(spawnableEntity.actionEntity, battleOption);
            serializedSpawnedEntities.push({
              entity: {
                ...spawnableEntity,
                actionEntity: spawnableEntity.actionEntity.toSerialized(),
              },
            });
            break;
          }
        }

        context.tracker.spawnedEntities.push(spawnableEntity);
      }

      gameUpdateCommand = {
        type: GameUpdateCommandType.SpawnEntities,
        step: stepType,
        actionName: context.tracker.actionExecutionIntent.actionName,
        completionOrderId: null,
        entities: serializedSpawnedEntities,
      };
    }

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick(): void {}

  getTimeToCompletion = () => 0;

  protected getBranchingActions = () => [];
}
