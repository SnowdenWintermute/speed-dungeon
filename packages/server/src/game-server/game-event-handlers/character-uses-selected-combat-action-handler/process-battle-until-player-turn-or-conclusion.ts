import {
  ActionCommand,
  ActionCommandPayload,
  AdventuringParty,
  Battle,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import checkForWipes from "../combat-action-results-processing/check-for-wipes.js";
import { getBattleConclusionCommandAndPayload } from "../action-command-handlers/get-battle-conclusion-command-and-payload.js";
import getAIControlledTurnActionCommandPayloads from "../combat-action-results-processing/get-ai-controlled-turn-action-command-payloads.js";

export async function processBattleUntilPlayerTurnOrConclusion(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battleOption: Battle | null
): Promise<Error | ActionCommandPayload[]> {
  const actionCommandPayloads = [];

  if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
  let partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  let battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;
  let newActiveCombatantTrackerOption: undefined | CombatantTurnTracker =
    battleOption?.turnTrackers[0];

  while (!battleConcluded && newActiveCombatantTrackerOption) {
    const activeCombatantResult = SpeedDungeonGame.getCombatantById(
      game,
      newActiveCombatantTrackerOption.entityId
    );
    if (activeCombatantResult instanceof Error) return activeCombatantResult;
    let { combatantProperties } = activeCombatantResult;
    const activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
    if (!activeCombatantIsAiControlled) break;
    const aiActionCommandPayloadsResult = await getAIControlledTurnActionCommandPayloads(
      game,
      party,
      activeCombatantResult
    );
    if (aiActionCommandPayloadsResult instanceof Error) return aiActionCommandPayloadsResult;
    const aiActionCommands = aiActionCommandPayloadsResult.map(
      (item) =>
        new ActionCommand(game.name, activeCombatantResult.entityProperties.id, item, gameServer)
    );

    party.actionCommandQueue.enqueueNewCommands(aiActionCommands);
    const errors = await party.actionCommandQueue.processCommands();
    if (errors.length) {
      console.error(errors);
      return new Error("Error processing action commands");
    }

    actionCommandPayloads.push(...aiActionCommandPayloadsResult);

    if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
    partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
    if (partyWipesResult instanceof Error) return partyWipesResult;
    battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;

    if (battleConcluded) {
      const conclusionResult = await getBattleConclusionCommandAndPayload(
        game,
        party,
        partyWipesResult
      );
      if (conclusionResult instanceof Error) return conclusionResult;
      party.actionCommandQueue.enqueueNewCommands([conclusionResult.command]);
      await party.actionCommandQueue.processCommands();
      actionCommandPayloads.push(conclusionResult.payload);
    }

    newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];
  }

  return actionCommandPayloads;
}
