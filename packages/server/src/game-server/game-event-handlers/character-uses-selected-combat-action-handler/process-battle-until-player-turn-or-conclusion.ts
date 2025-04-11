import {
  AISelectActionAndTarget,
  ActionCommand,
  ActionCommandPayload,
  ActionCommandType,
  AdventuringParty,
  Battle,
  CombatActionReplayTreePayload,
  CombatantContext,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { checkForWipes } from "../combat-action-results-processing/check-for-wipes.js";
import { processCombatAction } from "./process-combat-action.js";
import { getBattleConclusionCommandAndPayload } from "../action-command-handlers/get-battle-conclusion-command-and-payload.js";

export async function processBattleUntilPlayerTurnOrConclusion(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battleOption: Battle | null
) {
  if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);
  let partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
  if (partyWipesResult instanceof Error) return partyWipesResult;
  let battleConcluded = false;
  let newActiveCombatantTrackerOption: undefined | CombatantTurnTracker =
    battleOption?.turnTrackers[0];

  while (battleOption && !battleConcluded && newActiveCombatantTrackerOption) {
    partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
    battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;

    if (battleConcluded) {
      let actionCommandPayloads: ActionCommandPayload[] = [];
      const conclusion = await getBattleConclusionCommandAndPayload(game, party, partyWipesResult);
      actionCommandPayloads.push(conclusion.payload);
      party.actionCommandQueue.enqueueNewCommands([conclusion.command]);
      const payloadsResult = await party.actionCommandQueue.processCommands();
      if (payloadsResult instanceof Error) return payloadsResult;
      actionCommandPayloads.push(...payloadsResult);
      const payloadsCommands = payloadsResult.map(
        (item) => new ActionCommand(game.name, item, gameServer)
      );
      party.actionCommandQueue.enqueueNewCommands(payloadsCommands);
      await party.actionCommandQueue.processCommands();

      gameServer.io
        .in(getPartyChannelName(game.name, party.name))
        .emit(ServerToClientEvent.ActionCommandPayloads, actionCommandPayloads);
      break;
    }

    const activeCombatantResult = SpeedDungeonGame.getCombatantById(
      game,
      newActiveCombatantTrackerOption.entityId
    );
    if (activeCombatantResult instanceof Error) return activeCombatantResult;
    let { combatantProperties } = activeCombatantResult;
    const activeCombatantIsAiControlled = combatantProperties.controllingPlayer === null;
    if (!activeCombatantIsAiControlled) {
      console.log("active combatant not AI controlled");
      break;
    }

    const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(
      battleOption,
      activeCombatantResult.entityProperties.id
    );
    if (battleGroupsResult instanceof Error) throw battleGroupsResult;

    const actionIntent = AISelectActionAndTarget(game, activeCombatantResult, battleGroupsResult);
    if (actionIntent instanceof Error) throw actionIntent;
    let skippedTurn = false;
    if (actionIntent === null) {
      // they skipped their turn due to no valid action
      console.log("ai skipped turn");
      const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
      skippedTurn = true;
      if (maybeError instanceof Error) return maybeError;
      newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];
      continue;
    }

    const replayTreeResult = processCombatAction(
      actionIntent,
      new CombatantContext(game, party, activeCombatantResult)
    );

    if (replayTreeResult instanceof Error) return replayTreeResult;
    const { rootReplayNode, endedTurn } = replayTreeResult;

    newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];

    const payload: CombatActionReplayTreePayload = {
      type: ActionCommandType.CombatActionReplayTree,
      actionUserId: activeCombatantResult.entityProperties.id,
      root: rootReplayNode,
    };
    const payloads: ActionCommandPayload[] = [payload];
    if (endedTurn || skippedTurn) {
      console.log("sending ended turn payload");
      payloads.push({ type: ActionCommandType.EndActiveCombatantTurn });
    }

    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionCommandPayloads, payloads);
  }
}
