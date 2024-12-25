import {
  ActionCommand,
  ActionCommandType,
  AdventuringParty,
  BattleConclusion,
  BattleResultActionCommandPayload,
  CombatantTurnTracker,
  Consumable,
  ERROR_MESSAGES,
  Equipment,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import checkForWipes from "../combat-action-results-processing/check-for-wipes.js";
import { getGameServer } from "../../../singletons.js";

export async function handleBattleConclusionsAndAITurns(
  game: SpeedDungeonGame,
  party: AdventuringParty
) {
  const gameServer = getGameServer();
  if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
  const partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  const battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;
  if (battleConcluded) {
    let conclusion: BattleConclusion;
    let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
      equipment: [],
      consumables: [],
    };
    let experiencePointChanges: { [combatantId: string]: number } = {};

    if (partyWipesResult.alliesDefeated) {
      conclusion = BattleConclusion.Defeat;
    } else {
      conclusion = BattleConclusion.Victory;
      loot = gameServer.generateLoot(party);
      experiencePointChanges = gameServer.generateExperiencePoints(party);
    }

    const payload: BattleResultActionCommandPayload = {
      type: ActionCommandType.BattleResult,
      conclusion,
      loot: loot,
      experiencePointChanges,
      timestamp: Date.now(),
    };

    const battleConclusionActionCommand = new ActionCommand(
      game.name,
      party.characterPositions[0],
      payload,
      gameServer
    );

    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionCommandPayloads, party.characterPositions[0], [payload]);

    party.actionCommandQueue.enqueueNewCommands([battleConclusionActionCommand]);
    if (!party.actionCommandQueue.isProcessing) {
      const errors = await party.actionCommandQueue.processCommands();
      if (errors.length) {
        for (const error of errors) console.error(error);
        return new Error("Error");
      }
    }
  }

  const battleOption = party.battleId !== null ? game.battles[party.battleId] : undefined;

  const newActiveCombatantTrackerOption: undefined | CombatantTurnTracker =
    battleOption?.turnTrackers[0];

  // - if in combat, take ai controlled turn if appropriate
  if (!battleConcluded && newActiveCombatantTrackerOption) {
    const maybeError = await gameServer.takeAiControlledTurnIfActive(
      game,
      party,
      newActiveCombatantTrackerOption.entityId
    );
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
