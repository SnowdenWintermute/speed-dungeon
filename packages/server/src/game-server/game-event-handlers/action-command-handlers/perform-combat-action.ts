import {
  AdventuringParty,
  CombatantProperties,
  InputLock,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import { getCombatActionExecutionTime } from "@speed-dungeon/common";

export default function performCombatActionActionCommandHandler(
  this: GameServer,
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
  InputLock.increaseLockoutDuration(
    combatant.combatantProperties.inputLock,
    actionExecutionTimeResult
  );

  // - apply the hpChange, mpChange, and status effect changes from the payload

  if (mpChangesByEntityId)
    for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      CombatantProperties.changeMana(targetResult.combatantProperties, mpChange.mpChange);
    }
  if (hpChangesByEntityId)
    for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      const combatantWasAliveBeforeHpChange = targetCombatantProperties.hitPoints > 0;
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.hpChange);

      if (targetCombatantProperties.hitPoints <= 0)
        SpeedDungeonGame.handlePlayerDeath(game, party.battleId, targetId);

      if (!combatantWasAliveBeforeHpChange && targetCombatantProperties.hitPoints > 0) {
        // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
      }
    }

  // - get the next action

  party.actionCommandManager.processNextCommand();
}
