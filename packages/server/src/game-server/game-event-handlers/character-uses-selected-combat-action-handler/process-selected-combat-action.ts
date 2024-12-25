import {
  ActionCommand,
  AdventuringParty,
  Battle,
  CombatAction,
  CombatActionTarget,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { composeActionCommandPayloadsFromActionResults } from "./compose-action-command-payloads-from-action-results.js";
import { GameServer } from "../../index.js";
import { handleBattleConclusionsAndAITurns } from "../action-command-handlers/handle-battle-conclusions-and-ai-turns.js";

export default async function processSelectedCombatAction(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  actionUserId: string,
  selectedCombatAction: CombatAction,
  targets: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
): Promise<Error[]> {
  const actionResultsResult = SpeedDungeonGame.getActionResults(
    game,
    actionUserId,
    selectedCombatAction,
    targets,
    battleOption,
    allyIds
  );
  if (actionResultsResult instanceof Error) return [actionResultsResult];
  const actionResults = actionResultsResult;

  const actionCommandPayloads = composeActionCommandPayloadsFromActionResults(actionResults);

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, actionUserId, actionCommandPayloads);

  const actionCommands = actionCommandPayloads.map(
    (payload) => new ActionCommand(game.name, actionUserId, payload, this)
  );

  party.actionCommandQueue.enqueueNewCommands(actionCommands);
  if (!party.actionCommandQueue.isProcessing) {
    const errors = await party.actionCommandQueue.processCommands();

    const maybeError = await handleBattleConclusionsAndAITurns(game, party);
    if (maybeError instanceof Error) errors.push(maybeError);
    return errors;
  }

  return []; // aka no errors
}
