import {
  AISelectActionAndTarget,
  AdventuringParty,
  Battle,
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
      // const conclusionResult = await getBattleConclusionCommandAndPayload(
      //   game,
      //   party,
      //   partyWipesResult
      // );
      // if (conclusionResult instanceof Error) return conclusionResult;
      // party.actionCommandQueue.enqueueNewCommands([conclusionResult.command]);
      // const payloadsResult = await party.actionCommandQueue.processCommands();
      // if (payloadsResult instanceof Error) return payloadsResult;
      // actionCommandPayloads.push(conclusionResult.payload);
      // const payloadsCommands = payloadsResult.map(
      //   (item) => new ActionCommand(game.name, "", item, gameServer)
      // );
      // party.actionCommandQueue.enqueueNewCommands(payloadsCommands);
      // await party.actionCommandQueue.processCommands();
      // actionCommandPayloads.push(...payloadsResult);
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
    if (actionIntent === null) {
      // they skipped their turn due to no valid action
      console.log("ai skipped turn");
      const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
      if (maybeError instanceof Error) return maybeError;
      newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];
      continue;
    }

    const replayTreeResult = processCombatAction(
      actionIntent,
      new CombatantContext(game, party, activeCombatantResult)
    );

    if (replayTreeResult instanceof Error) return replayTreeResult;
    // replayTree.events.push(replayTreeResult);

    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
    if (maybeError instanceof Error) return maybeError;

    newActiveCombatantTrackerOption = battleOption?.turnTrackers[0];

    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionResultReplayTree, {
        actionUserId: activeCombatantResult.entityProperties.id,
        replayTree: replayTreeResult,
      });

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
  }

  // if (battleConcluded) {
  //   const conclusionResult = await getBattleConclusionCommandAndPayload(
  //     game,
  //     party,
  //     partyWipesResult
  //   );
  //   if (conclusionResult instanceof Error) return conclusionResult;
  //   party.actionCommandQueue.enqueueNewCommands([conclusionResult.command]);
  //   const payloadsResult = await party.actionCommandQueue.processCommands();
  //   if (payloadsResult instanceof Error) return payloadsResult;
  //   actionCommandPayloads.push(conclusionResult.payload);

  //   const payloadsCommands = payloadsResult.map(
  //     (item) => new ActionCommand(game.name, "", item, gameServer)
  //   );
  //   party.actionCommandQueue.enqueueNewCommands(payloadsCommands);
  //   await party.actionCommandQueue.processCommands();

  //   actionCommandPayloads.push(...payloadsResult);
  // }
}
