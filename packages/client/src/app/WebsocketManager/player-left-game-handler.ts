import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { ERROR_MESSAGES, SpeedDungeonGame } from "@speed-dungeon/common";

export default function playerLeftGameHandler(
  mutateGameStore: MutateState<GameState>,
  username: string
) {
  mutateGameStore((state) => {
    if (!state.game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    SpeedDungeonGame.removePlayer(state.game, username);
  });
}
