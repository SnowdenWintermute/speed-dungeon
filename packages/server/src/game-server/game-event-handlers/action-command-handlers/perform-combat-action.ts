import {
  AdventuringParty,
  CombatantProperties,
  InputLock,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
  getCombatActionExecutionTime,
  ActionCommandManager,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";

export default function performCombatActionActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: PerformCombatActionActionCommandPayload
) {
  const { combatAction, hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } = payload;
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party, combatant } = actionAssociatedDataResult;
  // SERVER
  // - add the "action performance time" to the lockout time
  const actionExecutionTimeResult = getCombatActionExecutionTime(
    combatant.combatantProperties,
    combatAction
  );
  if (actionExecutionTimeResult instanceof Error) return actionExecutionTimeResult;
  InputLock.increaseLockoutDuration(party.inputLock, actionExecutionTimeResult);

  // - apply the hpChange, mpChange, and status effect changes from the payload

  if (mpChangesByEntityId)
    for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      CombatantProperties.changeMana(targetResult.combatantProperties, mpChange);
    }
  if (hpChangesByEntityId)
    for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      const combatantWasAliveBeforeHpChange = targetCombatantProperties.hitPoints > 0;
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.value);

      if (targetCombatantProperties.hitPoints <= 0)
        SpeedDungeonGame.handlePlayerDeath(game, party.battleId, targetId);

      if (!combatantWasAliveBeforeHpChange && targetCombatantProperties.hitPoints > 0) {
        // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
      }
    }

  // - get the next action

  actionCommandManager.processNextCommand();
}
