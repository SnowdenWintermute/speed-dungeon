import { MutateState } from "@/stores/mutate-state";
import { setAlert } from "../../alerts";
import { ERROR_MESSAGES, removeFromArray } from "@speed-dungeon/common";
import { GameState } from "@/stores/game-store";
import { AlertState } from "@/stores/alert-store";

export default function playerToggledReadyToStartGameHandler(
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>,
  username: string
) {
  mutateGameStore((gameState) => {
    const { game } = gameState;
    if (!game) return setAlert(mutateAlertStore, ERROR_MESSAGES.GAME_DOESNT_EXIST);

    if (game.playersReadied.includes(username)) removeFromArray(game.playersReadied, username);
    else game.playersReadied.push(username);
  });
}
