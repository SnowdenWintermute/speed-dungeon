import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import { gameWorld } from "../3d-world/SceneManager";
import { ImageManagerRequestType } from "../3d-world/game-world/image-manager";

export default function playerLeftGameHandler(username: string) {
  const thumbnailIdsToRemove: string[] = [];
  useGameStore.getState().mutateState((state) => {
    if (!state.game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const removedPlayerResult = SpeedDungeonGame.removePlayer(state.game, username);
    if (removedPlayerResult instanceof Error) return setAlert(removedPlayerResult.message);
    for (const character of removedPlayerResult.charactersRemoved) {
      for (const item of character.combatantProperties.inventory.items.concat(
        Object.values(character.combatantProperties.equipment)
      )) {
        thumbnailIdsToRemove.push(item.entityProperties.id);
      }
    }
  });

  gameWorld.current?.imageManager.enqueueMessage({
    type: ImageManagerRequestType.ItemDeletion,
    itemIds: thumbnailIdsToRemove,
  });
}
