import {
  ActionCommand,
  ActionCommandPayload,
  ActionCommandType,
  ActionIntentOptionAndUser,
  AdventuringParty,
  Battle,
  CombatActionReplayTreePayload,
  ERROR_MESSAGES,
  LOOP_SAFETY_ITERATION_LIMIT,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { checkForWipes, PartyWipes } from "./check-for-wipes.js";
import { processCombatAction } from "./process-combat-action.js";
import { getBattleConclusionCommandAndPayload } from "../action-command-handlers/get-battle-conclusion-command-and-payload.js";
import { ActionUserContext } from "@speed-dungeon/common";

export class BattleProcessor {
  constructor(
    private gameServer: GameServer,
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private battle: Battle
  ) {}

  async processBattleUntilPlayerTurnOrConclusion() {
    const { gameServer, game, party, battle } = this;
    if (!party.characterPositions[0]) return new Error(ERROR_MESSAGES.PARTY.MISSING_CHARACTERS);

    battle.turnOrderManager.updateTrackers(game, party);
    let currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    const payloads: ActionCommandPayload[] = [];

    let safetyCounter = -1;
    while (currentActorTurnTracker) {
      safetyCounter += 1;
      if (safetyCounter > LOOP_SAFETY_ITERATION_LIMIT) {
        console.error(
          ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT),
          "in process-battle-until-player-turn-or-conclusion"
        );
        break;
      }

      battle.turnOrderManager.updateTrackers(game, party);
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
        shouldBreak = true;
      }

      if (shouldBreak) {
        break;
      }

      // get action intent for fastest actor
      const { actionExecutionIntent, user } = this.getNextActionIntentAndUser();

      console.log("actionExecutionIntent:", actionExecutionIntent, "user:", user.getName());

      // process action intents
      let shouldEndTurn = false;
      if (actionExecutionIntent === null) {
        console.info("AI action intent was null");
        shouldEndTurn = true;
      } else {
        const replayTreeResult = processCombatAction(
          actionExecutionIntent,
          new ActionUserContext(game, party, user)
        );

        if (replayTreeResult instanceof Error) return replayTreeResult;
        const { rootReplayNode } = replayTreeResult;

        const actionUserId = user.getEntityId();
        const payload: CombatActionReplayTreePayload = {
          type: ActionCommandType.CombatActionReplayTree,
          actionUserId,
          root: rootReplayNode,
        };

        payloads.push(payload);
      }

      currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();
    }

    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.ActionCommandPayloads, payloads);
  }

  getNextActionIntentAndUser(): ActionIntentOptionAndUser {
    const { game, party, battle } = this;
    // get action intents for conditions or ai combatants
    battle.turnOrderManager.updateTrackers(game, party);
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    return fastestActorTurnTracker.getNextActionIntentAndUser(game, party, battle);
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
