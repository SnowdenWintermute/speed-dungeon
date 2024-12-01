import { setAlert } from "../../components/alerts";
import { ERROR_MESSAGES, removeFromArray } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import enqueueCharacterItemsForThumbnails from "@/utils/enqueue-character-items-for-thumbnails";

export default function playerToggledReadyToStartGameHandler(username: string) {
  useGameStore.getState().mutateState((gameState) => {
    const { game } = gameState;
    if (!game) return setAlert(ERROR_MESSAGES.GAME_DOESNT_EXIST);

    if (game.playersReadied.includes(username)) removeFromArray(game.playersReadied, username);
    else game.playersReadied.push(username);
  });

  const partyOption = useGameStore.getState().getParty();
  if (partyOption instanceof Error) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
  for (const character of Object.values(partyOption.characters)) {
    enqueueCharacterItemsForThumbnails(character);
  }
}
