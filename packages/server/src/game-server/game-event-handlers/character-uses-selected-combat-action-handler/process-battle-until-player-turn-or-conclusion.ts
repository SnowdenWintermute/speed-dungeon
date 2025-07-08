import {
  AISelectActionAndTarget,
  ActionCommand,
  ActionCommandPayload,
  ActionCommandType,
  AdventuringParty,
  Battle,
  CombatActionExecutionIntent,
  CombatActionReplayTreePayload,
  Combatant,
  CombatantCondition,
  CombatantContext,
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

    battle.turnOrderManager.updateTrackers(party);
    let currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    const payloads: ActionCommandPayload[] = [];

    while (currentActorTurnTracker) {
      battle.turnOrderManager.updateTrackers(party);
      currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

      const partyWipesResult = checkForWipes(game, party.characterPositions[0], party.battleId);
      const battleConcluded = partyWipesResult.alliesDefeated || partyWipesResult.opponentsDefeated;

      let shouldBreak = false;

      // battle ended, stop processing
      if (battleConcluded) {
        const battleConclusionPayloads = await this.handleBattleConclusion(partyWipesResult);
        if (battleConclusionPayloads instanceof Error) throw battleConclusionPayloads;
        payloads.push(...battleConclusionPayloads);
        shouldBreak = true;
      }
      // it is player's turn, stop processing
      if (battle.turnOrderManager.currentActorIsPlayerControlled(party)) {
        console.log("reached next player's turn");
        shouldBreak = true;
      }

      if (shouldBreak) {
        break;
      }

      // get action intent for fastest actor
      const { actionExecutionIntent, user } = this.getNextActionIntentAndUser();

      // process action intents
      let shouldEndTurn = false;
      if (actionExecutionIntent === null) {
        console.log("AI action intent was null");
        shouldEndTurn = true;
      } else {
        const replayTreeResult = processCombatAction(
          actionExecutionIntent,
          new CombatantContext(game, party, user)
        );

        if (replayTreeResult instanceof Error) return replayTreeResult;
        const { rootReplayNode } = replayTreeResult;

        const actionUserId = user.entityProperties.id;
        const payload: CombatActionReplayTreePayload = {
          type: ActionCommandType.CombatActionReplayTree,
          actionUserId,
          root: rootReplayNode,
        };

        payloads.push(payload);
      }

      currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();
    }

    console.log("payloads:", payloads);

    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionCommandPayloads, payloads);
  }

  getNextActionIntentAndUser(): {
    actionExecutionIntent: null | CombatActionExecutionIntent;
    user: Combatant;
  } {
    const { game, party, battle } = this;
    // get action intents for conditions or ai combatants
    battle.turnOrderManager.updateTrackers(party);
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    if (fastestActorTurnTracker instanceof ConditionTurnTracker) {
      // @TODO - implement getting action intent from condition
      const condition = fastestActorTurnTracker.getCondition(this.party);
      const combatant = fastestActorTurnTracker.getCombatant(this.party);
      if (condition.tickProperties === undefined)
        throw new Error("expected condition tick properties were missing");
      const triggeredActions = condition.tickProperties.onTick();

      CombatantCondition.removeStacks(
        condition.id,
        combatant.combatantProperties,
        triggeredActions.numStacksRemoved
      );
      // @TODO - send client stacks removed update

      const { actionExecutionIntent, user } = triggeredActions.triggeredAction;
      return { actionExecutionIntent, user };
    } else {
      const activeCombatantResult = fastestActorTurnTracker.getCombatant(party);
      if (activeCombatantResult instanceof Error) throw activeCombatantResult;
      let { entityProperties } = activeCombatantResult;

      const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battle, entityProperties.id);
      if (battleGroupsResult instanceof Error) throw battleGroupsResult;

      const actionExecutionIntent = AISelectActionAndTarget(
        game,
        activeCombatantResult,
        battleGroupsResult
      );
      if (actionExecutionIntent instanceof Error) throw actionExecutionIntent;
      return { actionExecutionIntent, user: activeCombatantResult };
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

    return actionCommandPayloads;
  }
}
