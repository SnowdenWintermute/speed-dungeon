import { ActionCommand, ERROR_MESSAGES } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { ModelManager } from "..";
import {
  ChangeEquipmentModelAction,
  ClearAllModelsModelAction,
  DespawnEnvironmentModelModelAction,
  ModelActionType,
  ProcessActionCommandsModelAction,
  SelectHotswapSlotModelAction,
  SpawnEnvironmentalModelModelAction,
} from "../model-actions";
import { removeHoldableModelFromCharacterModel } from "./remove-holdable-from-modular-character";
import { equipHoldableModelToCharacterModel } from "./equip-holdable-to-modular-character";
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
    [ModelActionType.ChangeEquipment]: async function (
      action: ChangeEquipmentModelAction
    ): Promise<void | Error> {
      let errors: Error[] = [];
      const modularCharacter = modelManager.combatantModels[action.entityId];
      if (!modularCharacter) return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      for (const id of action.unequippedIds)
        removeHoldableModelFromCharacterModel(modularCharacter, action.entityId, id);
      if (action.toEquip) {
        await equipHoldableModelToCharacterModel(
          modularCharacter,
          action.toEquip.slot,
          action.toEquip.item
        );
      }

      if (modularCharacter.isIdling()) modularCharacter.startIdleAnimation(500);
      else console.log("wasn't idling");

      if (errors.length)
        return new Error(
          "Errors equipping holdables: " + errors.map((error) => error.message).join(", ")
        );
    },
    [ModelActionType.SelectHotswapSlot]: async function (
      action: SelectHotswapSlotModelAction
    ): Promise<void | Error> {
      const modularCharacter = modelManager.combatantModels[action.entityId];
      if (!modularCharacter) return new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      const maybeError = await modularCharacter.handleHotswapSlotChanged(
        action.hotswapSlots,
        action.selectedIndex
      );
      if (maybeError instanceof Error) return maybeError;
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
