import {
  ActionResult,
  CharacterAssociatedData,
  CombatTurnResult,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import validateCombatActionUse from "./combat-action-results-processing/validate-combat-action-use";
import checkForDefeatedCombatantGroups from "./combat-action-results-processing/check-for-defeated-combatant-groups";
import takeAiControlledTurnsIfAppropriate from "./combat-action-results-processing/take-ai-controlled-turns-if-appropriate";

export default function useSelectedCombatActionHandler(
  this: GameServer,
  characterAssociatedData: CharacterAssociatedData
) {
  const { game, party, character } = characterAssociatedData;

  const actionResultsForClient: ActionResult[] = [];

  const { selectedCombatAction } = character.combatantProperties;
  console.log("selectedCombatAction: ", selectedCombatAction);
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  let partyWipesResult: Error | { alliesDefeated: boolean; opponentsDefeated: boolean } = new Error(
    "not assigned"
  );

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
  actionResultsForClient.push(...actionResults);
  // APPLY ACTION RESULTS
  SpeedDungeonGame.applyActionResults(game, actionResults, party.battleId);

  // check if party or monsters wiped
  const monsterIds = Object.values(party.currentRoom.monsters).map(
    (monster) => monster.entityProperties.id
  );
  partyWipesResult = checkForDefeatedCombatantGroups(game, party.characterPositions, monsterIds);
  if (partyWipesResult instanceof Error) return partyWipesResult;

  // check if action ended turn
  const actionsEndedTurn = actionResults.reduce(
    (accumulator, actionResult) => (actionResult.endsTurn ? true : accumulator),
    false
  );
  if (actionsEndedTurn) {
    const turns: CombatTurnResult[] = [];
    turns.push({ combatantId: character.entityProperties.id, actionResults });
    if (
      !partyWipesResult.alliesDefeated &&
      !partyWipesResult.opponentsDefeated &&
      battleOption !== null
    ) {
      // only end turn if still alive; dead combatants already have their turn trackers
      // removed
      if (character.combatantProperties.hitPoints > 0) {
        const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
        if (maybeError instanceof Error) return maybeError;
      }
      const aiControlledTurnResults = takeAiControlledTurnsIfAppropriate(game, battleOption);
      if (aiControlledTurnResults instanceof Error) return aiControlledTurnResults;
      turns.push(...aiControlledTurnResults);
      // ai turns may have wiped a party
      partyWipesResult = checkForDefeatedCombatantGroups(
        game,
        party.characterPositions,
        monsterIds
      );
      if (partyWipesResult instanceof Error) return partyWipesResult;
    }
    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.TurnResults, turns);
  } else {
    // emit raw action results
    this.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.RawActionResults, actionResults);
  }
  // emit battle end report if wiped or defeated monsters
  if (partyWipesResult instanceof Error) return partyWipesResult;
  if (partyWipesResult.alliesDefeated) {
    const partyWipeResult = this.handlePartyWipe(game, party);
    if (partyWipeResult instanceof Error) return partyWipeResult;
  } else if (partyWipesResult.opponentsDefeated) {
    const battleVictoryResult = this.handleBattleVictory(party);
    if (battleVictoryResult instanceof Error) return battleVictoryResult;
  }
}
