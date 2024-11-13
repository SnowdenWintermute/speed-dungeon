import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function playerLeftGameHandler(username: string) {
  useGameStore.getState().mutateState((state) => {
    if (!state.game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    SpeedDungeonGame.removePlayer(state.game, username);
  });
}
