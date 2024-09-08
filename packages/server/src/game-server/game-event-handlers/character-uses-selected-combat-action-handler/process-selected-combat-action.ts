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
import composeActionCommandPayloadsFromActionResults from "./compose-action-command-payloads-from-action-results";
import { GameServer } from "../..";

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
  // GET ABILITY OR CONSUMABLE USE RESULTS
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

  // COMPOSE ACTION COMMANDS
  const actionCommandPayloads = composeActionCommandPayloadsFromActionResults(actionResults);

  // SEND ACTION COMMAND PAYLOADS TO CLIENT
  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, actionUserId, actionCommandPayloads);

  // CREATE ACTION COMMANDS FROM PAYLOADS
  const actionCommands = actionCommandPayloads.map(
    (payload) =>
      new ActionCommand(game.name, party.actionCommandManager, actionUserId, payload, this)
  );

  // ENQUEUE AND START PROCESSING ACTION COMMANDS IN THEIR PARTY'S QUEUE IF NOT ALREADY DOING SO
  party.actionCommandManager.enqueueNewCommands(actionCommands);
}
