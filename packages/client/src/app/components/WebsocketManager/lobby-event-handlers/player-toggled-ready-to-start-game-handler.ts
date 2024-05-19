import { MutateAlertStore } from "@/stores/alert-store";
import { MutateGameStore } from "@/stores/game-store";
import { setAlert } from "../../alerts";
import { ERROR_MESSAGES, removeFromArray } from "@speed-dungeon/common";

export default function playerToggledReadyToStartGameHandler(
  mutateGameStore: MutateGameStore,
  mutateAlertStore: MutateAlertStore,
  username: string
) {
  mutateGameStore((gameState) => {
    const { game } = gameState;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME_DOESNT_EXIST);


    if (game.playersReadied.includes(username)) removeFromArray(game.playersReadied, username);
    else game.playersReadied.push(username);
  });
}
