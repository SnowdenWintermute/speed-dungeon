import {
  CombatantProperties,
  InputLock,
  ReturnHomeActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import checkForWipes from "../combat-action-results-processing/check-for-wpies";

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

  const partyWipesResult = checkForWipes(game, combatantId, party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  if (partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated) {
    // @TODO - handle party wipes
  }

  // - unlock the character's inputs (if in combat they will still be "locked" in the sense it isn't their turn)
  // - we'll let the next player input now, even if it takes a long time to animate this player running home
  //   the clien't shouldn't play the next action until they get back. They can show a "ready up" pose while waiting but
  //   at least they get to put in their inputs
  InputLock.unlockInput(combatant.combatantProperties.inputLock);
  console.log("unlocked input");
  // - if in combat, take ai controlled turn if appropriate

  // @TODO - take AI turns
}
