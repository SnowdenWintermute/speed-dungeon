import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import {
  nextToBabylonMessageQueue,
  NextToBabylonMessageTypes,
} from "@/singletons/next-to-babylon-message-queue";
import { useGameStore } from "@/stores/game-store";
import { Vector3 } from "@babylonjs/core";

export default function gameStartedHandler(timeStarted: number) {
  useGameStore.getState().mutateState((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;

    gameState.combatLogMessages = [
      new CombatLogMessage("A new game has begun!", CombatLogMessageStyle.Basic),
    ];

    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.MoveCamera,
      instant: true,
      alpha: 3.09,
      // alpha: 2.94,
      beta: 1.14,
      // beta: 1.27,
      radius: 8,
      // radius: 2.38,
      target: new Vector3(0.92, 0.54, 0.62),
      // target: new Vector3(-2.92, 2.08, 1.03),
    });
  });
}
