import {
  ActionCommand,
  ActionCommandType,
  BattleConclusion,
  BattleResultActionCommandPayload,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  InputLock,
  Item,
  ReturnHomeActionCommandPayload,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import checkForWipes from "../combat-action-results-processing/check-for-wipes";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

export default function returnHomeActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
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
  let newActiveCombatantTrackerOption: null | CombatantTurnTracker = null;
  if (party.battleId !== null && shouldEndTurn) {
    // @todo - if this combatant is dead that means they killed themselves on their own turn
    // which means their turn tracker was already removed, so we'll need to custom handle that
    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, party.battleId);
    if (maybeError instanceof Error) return maybeError;
    newActiveCombatantTrackerOption = maybeError;
    console.log(
      "ended active combatant turn, new active combatant: ",
      newActiveCombatantTrackerOption.entityId
    );
  }

  // - check for party wipes and victories and apply/emit them

  // check for wipes from the perspective of the players (allies are the party characters, enemies are the monsters)
  if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
  const partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  const battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;
  if (battleConcluded) {
    let conclusion: BattleConclusion;
    const loot: Item[] = [];
    let experiencePointChanges: { [combatantId: string]: number } = {};

    if (partyWipesResult.alliesDefeated) {
      console.log("PLAYER PARTY DEFEATED");
      conclusion = BattleConclusion.Defeat;
    } else {
      conclusion = BattleConclusion.Victory;
      console.log("BATTLE VICTORY");
      loot.push(...this.generateLoot(game, party));
      experiencePointChanges = this.generateExperiencePoints(party);
    }

    const payload: BattleResultActionCommandPayload = {
      type: ActionCommandType.BattleResult,
      conclusion,
      loot,
      experiencePointChanges,
      timestamp: Date.now(),
    };

    const battleConclusionActionCommand = new ActionCommand(
      game.name,
      actionCommandManager,
      party.characterPositions[0],
      payload,
      this
    );

    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionCommandPayloads, party.characterPositions[0], [payload]);

    actionCommandManager.enqueueNewCommands([battleConclusionActionCommand]);
  }

  // - unlock the character's inputs (if in combat they will still be "locked" in the sense it isn't their turn)
  // - we'll let the next player input now, even if it takes a long time to animate this player running home
  //   the clien't shouldn't play the next action until they get back. They can show a "ready up" pose while waiting but
  //   at least they get to put in their inputs
  InputLock.unlockInput(party.inputLock);

  // - if in combat, take ai controlled turn if appropriate
  if (!battleConcluded && newActiveCombatantTrackerOption !== null) {
    const maybeError = this.takeAiControlledTurnIfActive(
      game,
      party,
      newActiveCombatantTrackerOption.entityId
    );
    if (maybeError instanceof Error) return console.error(maybeError);
  }

  actionCommandManager.processNextCommand();
}
