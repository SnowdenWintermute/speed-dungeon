import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";

export default function gameStartedHandler(
  mutateGameStore: MutateState<GameState>,
  mutateNextBabylonMessagingStore: MutateState<NextBabylonMessagingState>,
  timeStarted: number
) {
  mutateGameStore((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;
  });

  // spawn character models
}
