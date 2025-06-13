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
  ConditionTurnTracker,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { checkForWipes, PartyWipes } from "./check-for-wipes.js";
import { processCombatAction } from "./process-combat-action.js";
import { getBattleConclusionCommandAndPayload } from "../action-command-handlers/get-battle-conclusion-command-and-payload.js";

export class BattleProcessor {
  constructor(
    private gameServer: GameServer,
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private battle: Battle
  ) {
    //
  }

  async processBattleUntilPlayerTurnOrConclusion() {
    const { gameServer, game, party, battle } = this;
    if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);

    let currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    while (currentActorTurnTracker) {
      const partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
      const battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;

      // battle ended, stop processing
      if (battleConcluded) {
        await this.handleBattleConclusion(partyWipesResult);
        break;
      }
      // it is player's turn, stop processing
      if (battle.turnOrderManager.currentActorIsPlayerControlled(party)) break;

      // get action intent for fastest actor
      const actionIntent = this.getNextActionIntent();
      // process action intents
      let skippedTurn = false;
      if (actionIntent === null) {
        // use the new turn order manager to end their turn

        // they skipped their turn due to no valid action
        console.log("ai skipped turn");
        const maybeError = Battle.endCombatantTurnIfInBattle(game, battle, entityProperties.id);
        skippedTurn = true;
        if (maybeError instanceof Error) return maybeError;
        newActiveCombatantTrackerOption = battle.turnTrackers[0];
        continue;
      }

      const replayTreeResult = processCombatAction(
        actionIntent,
        new CombatantContext(game, party, activeCombatantResult)
      );

      if (replayTreeResult instanceof Error) return replayTreeResult;
      const { rootReplayNode, endedTurn } = replayTreeResult;

      newActiveCombatantTrackerOption = battle.turnTrackers[0];

      const actionUserId = activeCombatantResult.entityProperties.id;
      const payload: CombatActionReplayTreePayload = {
        type: ActionCommandType.CombatActionReplayTree,
        actionUserId,
        root: rootReplayNode,
      };

      const payloads: ActionCommandPayload[] = [payload];

      if (endedTurn || skippedTurn) {
        payloads.push({
          type: ActionCommandType.EndCombatantTurnIfFirstInTurnOrder,
          entityId: actionUserId,
        });
      }

      gameServer.io
        .in(getPartyChannelName(game.name, party.name))
        .emit(ServerToClientEvent.ActionCommandPayloads, payloads);
    }
  }

  getNextActionIntent() {
    const { game, party, battle } = this;
    // get action intents for conditions or ai combatants
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    if (fastestActorTurnTracker instanceof ConditionTurnTracker) {
      // @TODO - implement getting action intent from condition
      return null;
    } else {
      const activeCombatantResult = fastestActorTurnTracker.getCombatant(party);
      if (activeCombatantResult instanceof Error) throw activeCombatantResult;
      let { entityProperties } = activeCombatantResult;

      const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battle, entityProperties.id);
      if (battleGroupsResult instanceof Error) throw battleGroupsResult;

      const actionIntent = AISelectActionAndTarget(game, activeCombatantResult, battleGroupsResult);
      if (actionIntent instanceof Error) throw actionIntent;
      return actionIntent;
    }
  }

  async handleBattleConclusion(partyWipesResult: PartyWipes) {
    const { gameServer, game, party } = this;
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
  }
}
