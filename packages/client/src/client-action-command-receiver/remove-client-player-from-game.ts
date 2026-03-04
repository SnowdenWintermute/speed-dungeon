import { ERROR_MESSAGES, Username } from "@speed-dungeon/common";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { AppStore } from "@/mobx-stores/app-store";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import { setAlert } from "@/app/components/alerts";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";

export async function removeClientPlayerFromGame(username: Username) {
  const itemsToRemoveThumbnails: string[] = [];

  const gameOption = AppStore.get().gameStore.getGameOption();
  if (gameOption === null) {
    return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
  }

  const removedPlayerResult = gameOption.removePlayer(username);
  if (removedPlayerResult instanceof Error) {
    return setAlert(removedPlayerResult);
  }

  for (const character of removedPlayerResult.charactersRemoved) {
    gameOption.lowestStartingFloorOptionsBySavedCharacter.delete(character.entityProperties.id);

    itemsToRemoveThumbnails.push(
      ...character.combatantProperties.inventory.equipment.map((item) => item.entityProperties.id)
    );
    const hotswapSets = character.combatantProperties.equipment.getHoldableHotswapSlots();
    if (hotswapSets) {
      for (const hotswapSet of hotswapSets)
        itemsToRemoveThumbnails.push(
          ...Object.values(hotswapSet.holdables).map((item) => item.entityProperties.id)
        );
    }

    itemsToRemoveThumbnails.push(
      ...Object.values(character.combatantProperties.equipment.getWearables()).map(
        (item) => item.entityProperties.id
      )
    );
  }

  GameLogMessageService.postUserLeftGame(username);

  characterAutoFocusManager.focusFirstOwnedCharacter();

  getGameWorldView().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
    placeInHomePositions: true,
  });

  getGameWorldView().imageManager.enqueueMessage({
    type: ImageManagerRequestType.ItemDeletion,
    itemIds: itemsToRemoveThumbnails,
  });
}
