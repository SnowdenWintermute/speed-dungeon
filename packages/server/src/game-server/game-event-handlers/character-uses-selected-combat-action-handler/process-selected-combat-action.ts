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

export default function processSelectedCombatAction(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  actionUserId: string,
  selectedCombatAction: CombatAction,
  targets: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
) {
  const actionResultsResult = SpeedDungeonGame.getActionResults(
    game,
    actionUserId,
    selectedCombatAction,
    targets,
    battleOption,
    allyIds
  );
  if (actionResultsResult instanceof Error) return actionResultsResult;
  const actionResults = actionResultsResult;

  const actionCommandPayloads = composeActionCommandPayloadsFromActionResults(actionResults);

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, actionUserId, actionCommandPayloads);

  const actionCommands = actionCommandPayloads.map(
    (payload) =>
      new ActionCommand(game.name, party.actionCommandManager, actionUserId, payload, this)
  );

  party.actionCommandManager.enqueueNewCommands(actionCommands);
}
