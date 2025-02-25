import { ERROR_MESSAGES, HitOutcomesGameUpdateCommand } from "@speed-dungeon/common";
import { induceHitRecovery } from "../../combatant-models/animation-manager/induce-hit-recovery";
import { gameWorld } from "../../SceneManager";

export function hitOutcomesGameUpdateHandler(update: {
  command: HitOutcomesGameUpdateCommand;
  isComplete: boolean;
}) {
  console.log("GOT HIT OUTCOMES: ", update.command);
  const { command } = update;
  const { outcomes, actionUserId } = command;
  const { hitPointChanges } = outcomes;
  if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  if (hitPointChanges) {
    for (const [entityId, hpChange] of Object.entries(hitPointChanges)) {
      induceHitRecovery(gameWorld.current, actionUserId, entityId, hpChange, false);
    }
  }
  // apply the damage
  // enqueue the floating text messages
}
