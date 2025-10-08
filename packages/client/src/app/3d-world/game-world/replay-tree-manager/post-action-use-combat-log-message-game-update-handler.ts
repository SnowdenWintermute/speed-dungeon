import { postActionUseMessageToCombatLog } from "@/app/game/combat-log/post-action-use-message-to-combat-log";
import { useGameStore } from "@/stores/game-store";
import { ActionUseCombatLogMessageUpdateCommand } from "@speed-dungeon/common";
import { GameUpdateTracker } from "./game-update-tracker";

export async function postActionUseCombatLogMessageGameUpdateHandler(
  update: GameUpdateTracker<ActionUseCombatLogMessageUpdateCommand>
) {
  useGameStore.getState().mutateState((state) => {
    postActionUseMessageToCombatLog(state, update.command);
  });
  update.setAsQueuedToComplete();
}
