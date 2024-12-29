import { useGameStore } from "@/stores/game-store";
import { setAlert } from "../components/alerts";
import { CombatantEquipment, ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { gameWorld } from "../3d-world/SceneManager";
import { ImageManagerRequestType } from "../3d-world/game-world/image-manager";
import { CombatLogMessage, CombatLogMessageStyle } from "../game/combat-log/combat-log-message";
import { ModelActionType } from "../3d-world/game-world/model-manager/model-actions";

export async function removeClientPlayerFromGame(username: string) {
  const itemsToRemoveThumbnails: string[] = [];
  useGameStore.getState().mutateState((state) => {
    if (!state.game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const removedPlayerResult = SpeedDungeonGame.removePlayer(state.game, username);
    if (removedPlayerResult instanceof Error) return setAlert(removedPlayerResult);

    for (const character of removedPlayerResult.charactersRemoved) {
      delete state.game.lowestStartingFloorOptionsBySavedCharacter[character.entityProperties.id];

      itemsToRemoveThumbnails.push(
        ...character.combatantProperties.inventory.equipment.map((item) => item.entityProperties.id)
      );
      const hotswapSets = CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties);
      if (hotswapSets)
        for (const hotswapSet of hotswapSets)
          itemsToRemoveThumbnails.push(
            ...Object.values(hotswapSet.holdables).map((item) => item.entityProperties.id)
          );
      itemsToRemoveThumbnails.push(
        ...Object.values(character.combatantProperties.equipment.wearables).map(
          (item) => item.entityProperties.id
        )
      );
    }

    state.combatLogMessages.push(
      new CombatLogMessage(`${username} left the game`, CombatLogMessageStyle.PartyWipe)
    );
  });

  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });

  gameWorld.current?.imageManager.enqueueMessage({
    type: ImageManagerRequestType.ItemDeletion,
    itemIds: itemsToRemoveThumbnails,
  });
}
