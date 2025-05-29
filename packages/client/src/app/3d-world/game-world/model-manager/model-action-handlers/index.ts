import { ActionCommand } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { ModelManager } from "..";
import {
  ChangeEquipmentModelAction,
  ClearAllModelsModelAction,
  DespawnEnvironmentModelModelAction,
  ModelActionType,
  ProcessActionCommandsModelAction,
  SpawnEnvironmentalModelModelAction,
} from "../model-actions";
import { actionCommandQueue, actionCommandReceiver } from "@/singletons/action-command-manager";
import { synchronizeCombatantModelsWithAppState } from "./synchronize-combatant-models-with-app-state";
import { spawnEnvironmentModel } from "./spawn-environmental-model";
import { disposeAsyncLoadedScene } from "@/app/3d-world/utils";

export type ModelActionHandler = (...args: any[]) => Promise<Error | void> | (void | Error);

export function createModelActionHandlers(
  modelManager: ModelManager
): Record<ModelActionType, ModelActionHandler> {
  return {
    [ModelActionType.ClearAllModels]: (_action: ClearAllModelsModelAction) =>
      modelManager.clearAllModels(),
    [ModelActionType.SpawnEnvironmentModel]: (action: SpawnEnvironmentalModelModelAction) =>
      spawnEnvironmentModel(action, modelManager),
    [ModelActionType.DespawnEnvironmentModel]: (action: DespawnEnvironmentModelModelAction) => {
      const modelOption = modelManager.environmentModels[action.id];
      if (modelOption) {
        disposeAsyncLoadedScene(modelOption.model);
      }
    },
    [ModelActionType.SynchronizeCombatantModels]: synchronizeCombatantModelsWithAppState,
    [ModelActionType.SynchronizeCombatantEquipmentModels]: async function (
      action: ChangeEquipmentModelAction
    ): Promise<void | Error> {
      const modularCharacter = modelManager.findOne(action.entityId);

      await modularCharacter.equipmentModelManager.synchronizeCombatantEquipmentModels();

      if (modularCharacter.isIdling()) modularCharacter.startIdleAnimation(500);
      else console.log("wasn't idling");
    },
    [ModelActionType.ProcessActionCommands]: async function (
      action: ProcessActionCommandsModelAction
    ): Promise<void | Error> {
      const gameName = useGameStore.getState().gameName;
      if (!gameName) return console.error("No game name");
      const actionCommands = action.actionCommandPayloads.map(
        (item) => new ActionCommand(gameName, item, actionCommandReceiver)
      );
      actionCommandQueue.enqueueNewCommands(actionCommands);
      const result = await actionCommandQueue.processCommands();
      if (result instanceof Error) console.error(result);
      return;
    },
  };
}
