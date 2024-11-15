import {
  nextToBabylonMessageQueue,
  NextToBabylonMessageTypes,
} from "@/singletons/next-to-babylon-message-queue";
import { useGameStore } from "@/stores/game-store";
import { Vector3 } from "@babylonjs/core";

export default function gameStartedHandler(timeStarted: number) {
  useGameStore.getState().mutateState((gameState) => {
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
