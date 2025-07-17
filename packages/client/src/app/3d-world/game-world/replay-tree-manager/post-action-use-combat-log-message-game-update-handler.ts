import { postActionUseMessageToCombatLog } from "@/app/game/combat-log/post-action-use-message-to-combat-log";
import { useGameStore } from "@/stores/game-store";
import { ActionUseCombatLogMessageUpdateCommand } from "@speed-dungeon/common";

export async function postActionUseCombatLogMessageGameUpdateHandler(update: {
  command: ActionUseCombatLogMessageUpdateCommand;
  isComplete: boolean;
}) {
  console.log("about to call postActionUseMessageToCombatLog");
  useGameStore.getState().mutateState((state) => {
    postActionUseMessageToCombatLog(state, update.command);
  });
  update.isComplete = true;
}
