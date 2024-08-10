import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";

export default function gameStartedHandler(
  mutateGameStore: MutateState<GameState>,
  timeStarted: number
) {
  mutateGameStore((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;
  });

  // spawn character models
}
