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

  // while (!battleConcluded && newActiveCombatantTrackerOption) {
  //   const activeCombatantResult = SpeedDungeonGame.getCombatantById(
  //     game,
  //     newActiveCombatantTrackerOption.entityId
  //   );
  //   if (activeCombatantResult instanceof Error) return activeCombatantResult;
  //   let { combatantProperties } = activeCombatantResult;
  //   const activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
  //   if (!activeCombatantIsAiControlled) break;

  // @TODO - conform to the new ai behavior tree and action processing system
  // const aiActionCommandPayloadsResult = await getAIControlledTurnActionCommandPayloads(
  //   game,
  //   party,
  //   activeCombatantResult
  // );
  // if (aiActionCommandPayloadsResult instanceof Error) return aiActionCommandPayloadsResult;
  // const aiActionCommands = aiActionCommandPayloadsResult.map(
  //   (item) =>
  //     new ActionCommand(game.name, activeCombatantResult.entityProperties.id, item, gameServer)
  // );

  // party.actionCommandQueue.enqueueNewCommands(aiActionCommands);
  // // we may generate more payloads from processing the current commands, such as game messages about wipes
  // const newPayloadsResult = await party.actionCommandQueue.processCommands();
  // if (newPayloadsResult instanceof Error) return newPayloadsResult;
  // actionCommandPayloads.push(...aiActionCommandPayloadsResult);

  // const newPayloadsCommands = newPayloadsResult.map(
  //   (item) =>
  //     new ActionCommand(game.name, activeCombatantResult.entityProperties.id, item, gameServer)
  // );
  // party.actionCommandQueue.enqueueNewCommands(newPayloadsCommands);

  // actionCommandPayloads.push(...newPayloadsResult);

  // if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
  // partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
  // if (partyWipesResult instanceof Error) return partyWipesResult;
  // battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;

  // newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];
  // }

  if (battleConcluded) {
    const conclusionResult = await getBattleConclusionCommandAndPayload(
      game,
      party,
      partyWipesResult
    );
    if (conclusionResult instanceof Error) return conclusionResult;
    party.actionCommandQueue.enqueueNewCommands([conclusionResult.command]);
    const payloadsResult = await party.actionCommandQueue.processCommands();
    if (payloadsResult instanceof Error) return payloadsResult;
    actionCommandPayloads.push(conclusionResult.payload);

    const payloadsCommands = payloadsResult.map(
      (item) => new ActionCommand(game.name, "", item, gameServer)
    );
    party.actionCommandQueue.enqueueNewCommands(payloadsCommands);
    await party.actionCommandQueue.processCommands();

    actionCommandPayloads.push(...payloadsResult);
  }

  return actionCommandPayloads;
}
