import {
  nextToBabylonMessageQueue,
  NextToBabylonMessageTypes,
} from "@/singletons/next-to-babylon-message-queue";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { Vector3 } from "@babylonjs/core";

export default function gameStartedHandler(
  mutateGameStore: MutateState<GameState>,
  timeStarted: number
) {
  mutateGameStore((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;
    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.MoveCamera,
      instant: true,
      alpha: 3.09,
      beta: 1.14,
      radius: 8,
      target: new Vector3(0.92, 0.54, 0.62),
    });
  });
}
