import {
  ActionCommand,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  formatActionCommandType,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import validateCombatActionUse from "../combat-action-results-processing/validate-combat-action-use";
import composeActionCommandPayloadsFromActionResults from "./compose-action-command-payloads-from-action-results";

export default function useSelectedCombatActionHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;
  console.log("character ", character.entityProperties.name, " used selected action");

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );
  if (targetsAndBattleResult instanceof Error) return targetsAndBattleResult;
  const { targets, battleOption } = targetsAndBattleResult;

  // GET ABILITY OR CONSUMABLE USE RESULTS
  const actionResultsResult = SpeedDungeonGame.getActionResults(
    game,
    character.entityProperties.id,
    selectedCombatAction,
    targets,
    battleOption,
    party.characterPositions
  );
  if (actionResultsResult instanceof Error) return actionResultsResult;
  const actionResults = actionResultsResult;

  // COMPOSE ACTION COMMANDS
  const actionCommandPayloads = composeActionCommandPayloadsFromActionResults(actionResults);
  console.log(
    "created payloads: ",
    actionCommandPayloads.map((payload) => formatActionCommandType(payload.type))
  );

  // SEND ACTION COMMAND PAYLOADS TO CLIENT
  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.ActionCommandPayloads,
      character.entityProperties.id,
      actionCommandPayloads
    );

  // CREATE ACTION COMMANDS FROM PAYLOADS
  const actionCommands = actionCommandPayloads.map(
    (payload) => new ActionCommand(game.name, character.entityProperties.id, payload, this)
  );

  console.log(
    "commands: ",
    actionCommands.map((command) => formatActionCommandType(command.payload.type))
  );

  // ENQUEUE AND START PROCESSING ACTION COMMANDS IN THEIR PARTY'S QUEUE IF NOT ALREADY DOING SO
  party.actionCommandManager.enqueueNewCommands(actionCommands);
}

//////////////////////////// OLD CODE

// // APPLY ACTION RESULTS
// SpeedDungeonGame.applyActionResults(game, actionResults, party.battleId);

// // check if party or monsters wiped
// const monsterIds = Object.values(party.currentRoom.monsters).map(
//   (monster) => monster.entityProperties.id
// );
// partyWipesResult = checkForDefeatedCombatantGroups(game, party.characterPositions, monsterIds);
// if (partyWipesResult instanceof Error) return partyWipesResult;

// // check if action ended turn
// let actionsEndedTurn = false;
// actionResults.forEach((actionResult) => {
//   if (actionResult.endsTurn) actionsEndedTurn = true;
// });

// if (actionsEndedTurn) {
//   const turns: CombatTurnResult[] = [];
//   turns.push({ combatantId: character.entityProperties.id, actionResults });
//   if (
//     !partyWipesResult.alliesDefeated &&
//     !partyWipesResult.opponentsDefeated &&
//     battleOption !== null
//   ) {
//     // only end turn if still alive; dead combatants already have their turn trackers
//     // removed
//     if (character.combatantProperties.hitPoints > 0) {
//       console.log("ending turn");
//       const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
//       if (maybeError instanceof Error) return maybeError;
//     }
//     const aiControlledTurnResults = takeAiControlledTurnsIfAppropriate(game, battleOption);
//     if (aiControlledTurnResults instanceof Error) return aiControlledTurnResults;
//     turns.push(...aiControlledTurnResults);
//     // ai turns may have wiped a party
//     partyWipesResult = checkForDefeatedCombatantGroups(
//       game,
//       party.characterPositions,
//       monsterIds
//     );
//     if (partyWipesResult instanceof Error) return partyWipesResult;
//   }
//   // this.io
//   //   .in(getPartyChannelName(game.name, party.name))
//   //   .emit(ServerToClientEvent.TurnResults, turns);
// } else {
//   // emit raw action results
//   // this.io
//   //   .in(getPartyChannelName(game.name, party.name))
//   //   .emit(ServerToClientEvent.RawActionResults, actionResults);
// }
// // emit battle end report if wiped or defeated monsters
// if (partyWipesResult instanceof Error) return partyWipesResult;
// if (partyWipesResult.alliesDefeated) {
//   const partyWipeResult = this.handlePartyWipe(game, party);
//   if (partyWipeResult instanceof Error) return partyWipeResult;
// } else if (partyWipesResult.opponentsDefeated) {
//   const battleVictoryResult = this.handleBattleVictory(party);
//   if (battleVictoryResult instanceof Error) return battleVictoryResult;
// }