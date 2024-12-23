import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { spawnModularCharacter } from "./spawn-modular-character";
import { ModelManager } from "..";
import {
  ChangeEquipmentModelAction,
  DespawnCombatantModelAction,
  ModelActionType,
  ProcessActionCommandsModelAction,
  SelectHotswapSlotModelAction,
  SpawnCombatantModelAction,
} from "../model-actions";
import { despawnModularCharacter } from "./despawn-modular-character";
import { removeHoldableModelFromModularCharacter } from "./remove-holdable-from-modular-character";
import { equipHoldableModelToModularCharacter } from "./equip-holdable-to-modular-character";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { enqueueClientActionCommands } from "@/singletons/action-command-manager";

export type ModelActionHandler = (...args: any[]) => Promise<Error | void> | (void | Error);

export function createModelActionHandlers(modelManager: ModelManager) {
  return {
    [ModelActionType.SpawnCombatantModel]: async function (
      action: SpawnCombatantModelAction
    ): Promise<void | Error> {
      const combatantModelResult = await spawnModularCharacter(
        modelManager.world,
        action.blueprint
      );
      if (combatantModelResult instanceof Error) return combatantModelResult;
      modelManager.combatantModels[action.blueprint.combatant.entityProperties.id] =
        combatantModelResult;
    },
    [ModelActionType.DespawnCombatantModel]: function (
      action: DespawnCombatantModelAction
    ): void | Error {
      const toRemove = modelManager.combatantModels[action.entityId];
      if (!toRemove) return new Error("Tried to despawn a combatant model that didn't exist");
      const maybeError = despawnModularCharacter(modelManager.world, toRemove);
      if (maybeError instanceof Error) return maybeError;
      delete modelManager.combatantModels[action.entityId];
    },
    [ModelActionType.ChangeEquipment]: async function (
      action: ChangeEquipmentModelAction
    ): Promise<void | Error> {
      let errors: Error[] = [];
      for (const id of action.unequippedIds)
        removeHoldableModelFromModularCharacter(modelManager, action.entityId, id);
      if (action.toEquip) {
        const maybeError = await equipHoldableModelToModularCharacter(
          modelManager,
          action.entityId,
          action.toEquip.slot,
          action.toEquip.item
        );
        if (maybeError instanceof Error) errors.push(maybeError);
      }
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
    [ModelActionType.ProcessActionCommands]: function (
      action: ProcessActionCommandsModelAction
    ): void | Error | Promise<void | Error> {
      const focusedCharacteResult = getFocusedCharacter();
      if (focusedCharacteResult instanceof Error) return console.trace(focusedCharacteResult);

      useGameStore.getState().mutateState((state) => {
        if (action.entityId === focusedCharacteResult.entityProperties.id)
          state.stackedMenuStates = [];
      });
      enqueueClientActionCommands(action.entityId, action.actionCommandPayloads);
    },
  };
}
