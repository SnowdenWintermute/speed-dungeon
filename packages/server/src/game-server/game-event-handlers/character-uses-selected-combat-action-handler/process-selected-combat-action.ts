import {
  ACTION_COMMAND_TYPE_STRINGS,
  ActionCommand,
  AdventuringParty,
  Battle,
  CombatAction,
  CombatActionTarget,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { processBattleUntilPlayerTurnOrConclusion } from "./process-battle-until-player-turn-or-conclusion.js";
import { getActionCommandPayloadsFromCombatActionUse } from "./get-action-command-payloads-from-combat-action-use.js";

export default async function processSelectedCombatAction(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  actionUserId: string,
  selectedCombatAction: CombatAction,
  targets: CombatActionTarget,
  battleOption: null | Battle,
  allyIds: string[]
): Promise<Error | void> {
  const payloadsResult = getActionCommandPayloadsFromCombatActionUse(
    game,
    actionUserId,
    selectedCombatAction,
    targets,
    battleOption,
    allyIds
  );
  if (payloadsResult instanceof Error) return payloadsResult;
  const actionCommandPayloads = payloadsResult;

  const actionCommands = actionCommandPayloads.map(
    (payload) => new ActionCommand(game.name, actionUserId, payload, this)
  );

  party.actionCommandQueue.enqueueNewCommands(actionCommands);
  const errors = await party.actionCommandQueue.processCommands();
  if (errors.length) {
    console.error(errors);
    return new Error("Error processing action commands");
  }

  const battleProcessingPayloadsResult = await processBattleUntilPlayerTurnOrConclusion(
    this,
    game,
    party,
    battleOption
  );
  if (battleProcessingPayloadsResult instanceof Error) return battleProcessingPayloadsResult;
  actionCommandPayloads.push(...battleProcessingPayloadsResult);
  console.log(
    "battle processing payloads: ",
    battleProcessingPayloadsResult.map((item) => ACTION_COMMAND_TYPE_STRINGS[item.type])
  );

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.ActionCommandPayloads, actionCommandPayloads);
}
