import { setAlert } from "../../components/alerts";
import { ArrayUtils, ERROR_MESSAGES } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";

export default function playerToggledReadyToStartGameHandler(username: string) {
  useGameStore.getState().mutateState((gameState) => {
    const { game } = gameState;
    if (!game) return setAlert(new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST));

    if (game.playersReadied.includes(username))
      ArrayUtils.removeElement(game.playersReadied, username);
    else game.playersReadied.push(username);
  });
}
