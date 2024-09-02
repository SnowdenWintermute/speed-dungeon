import { Battle, ReturnHomeActionCommandPayload, SpeedDungeonGame } from "@speed-dungeon/common";
import { GameServer } from "../..";
import checkForDefeatedCombatantGroups from "../combat-action-results-processing/check-for-defeated-combatant-groups";

export default function returnHomeActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  const { shouldEndTurn } = payload;
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party, combatant } = actionAssociatedDataResult;
  // SERVER
  // - end the combatant's turn if in battle and action required turn
  if (party.battleId !== null && shouldEndTurn) {
    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, party.battleId);
    if (maybeError instanceof Error) return maybeError;
  }

  // - check for party wipes and victories and apply/emit them

  const battleGroupResult = Battle.getAllyAndEnemyBattleGroups(battle, combatantId);
  if (battleGroupResult instanceof Error) return battleGroupResult;
  const { allyGroup, enemyGroup } = battleGroupResult;

  const partyWipesResult = checkForDefeatedCombatantGroups(
    game,
    allyGroup.combatantIds,
    enemyGroup.combatantIds
  );
  if (partyWipesResult instanceof Error) return partyWipesResult;
  if (partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated) break;

  // - unlock the character's inputs (if in combat they will still be "locked" in the sense it isn't their turn)
  // - we'll let the next player input now, even if it takes a long time to animate this player running home
  //   the clien't shouldn't play the next action until they get back. They can show a "ready up" pose while waiting but
  //   at least they get to put in their inputs
  // - if in combat, take ai controlled turn if appropriate
}
