import {
  AdventuringParty,
  CombatantProperties,
  DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../..";

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
  // @todo - change how long an action takes based on its type and the user's equipment
  CombatantProperties.increaseLockoutDuration(
    combatant.combatantProperties,
    DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME
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
