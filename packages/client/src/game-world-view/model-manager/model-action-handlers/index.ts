import { ModelManager } from "../index.js";
import {
  ChangeEquipmentModelAction,
  ClearAllModelsModelAction,
  DespawnEnvironmentModelModelAction,
  ModelActionType,
  ProcessActionCommandsModelAction,
  SpawnEnvironmentalModelModelAction,
  SynchronizeCombatantModelsModelAction,
} from "../model-actions";
import { synchronizeCombatantModelsWithAppState } from "./synchronize-combatant-models-with-app-state";
import { spawnEnvironmentModel } from "./spawn-environmental-model";
import { AppStore } from "@/mobx-stores/app-store";

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
      const modelOption = modelManager.environmentModels.get(action.id);
      if (modelOption) {
        modelOption.model.dispose();
        modelManager.environmentModels.delete(action.id);
      }
    },
    [ModelActionType.SynchronizeCombatantModels]: (action: SynchronizeCombatantModelsModelAction) =>
      synchronizeCombatantModelsWithAppState({ placeInHomePositions: action.placeInHomePositions }),
    [ModelActionType.SynchronizeCombatantEquipmentModels]: async function (
      action: ChangeEquipmentModelAction
    ): Promise<void | Error> {
      const modularCharacter = modelManager.findOne(action.entityId);

      await modularCharacter.equipmentModelManager.synchronizeCombatantEquipmentModels();

      if (modularCharacter.isIdling()) modularCharacter.startIdleAnimation(500);
    },
    [ModelActionType.ProcessActionCommands]: async function (
      action: ProcessActionCommandsModelAction
    ): Promise<void | Error> {
      const gameName = AppStore.get().gameStore.getGameOption()?.name;
      if (gameName === undefined) {
        console.info("action commands tried to process but no game name");
        return;
      }
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
