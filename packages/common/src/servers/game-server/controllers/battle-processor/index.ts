import { ActionCommand } from "../../../../action-processing/action-command.js";
import { ActionIntentOptionAndUser } from "../../../../action-processing/action-steps/index.js";
import {
  ActionCommandPayload,
  ActionCommandType,
  CombatActionReplayTreePayload,
} from "../../../../action-processing/index.js";
import { processCombatAction } from "../../../../action-processing/process-combat-action.js";
import { ActionUserContext } from "../../../../action-user-context/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { LOOP_SAFETY_ITERATION_LIMIT } from "../../../../app-consts.js";
import { Battle } from "../../../../battle/index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { PartyWipes } from "../../../../types.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { getBattleConclusionCommandAndPayload } from "./get-battle-conclusion-command-and-payload.js";
import { ItemGenerator } from "../../../../items/item-creation/index.js";
import { RandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { ActionCommandReceiver } from "../../../../action-processing/action-command-receiver.js";
import { AssetAnalyzer } from "../../asset-analyzer/index.js";

export class BattleProcessor {
  constructor(
    private updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private battle: Battle,
    private idGenerator: IdGenerator,
    private itemGenerator: ItemGenerator,
    private rng: RandomNumberGenerator,
    private gameEventCommandReceiver: ActionCommandReceiver,
    private assetAnalyzer: AssetAnalyzer
  ) {}

  async processBattleUntilPlayerTurnOrConclusion() {
    const { game, party, battle } = this;
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

      const partyWipes = party.combatantManager.checkForWipes(party.isInCombat());

      const battleConcluded = partyWipes.alliesDefeated || partyWipes.opponentsDefeated;

      let shouldBreak = false;

      // battle ended, stop processing
      if (battleConcluded) {
        const battleConclusionPayloads = await this.handleBattleConclusion(partyWipes);
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

      console.info("actionExecutionIntent:", actionExecutionIntent, "user:", user.getName());

      // process action intents
      if (actionExecutionIntent === null) {
        console.info("AI action intent was null");
      } else {
        const replayTreeResult = processCombatAction(
          actionExecutionIntent,
          new ActionUserContext(game, party, user),
          this.idGenerator,
          this.assetAnalyzer.animationLengths,
          this.assetAnalyzer.boundingBoxes
        );

        if (replayTreeResult instanceof Error) {
          throw replayTreeResult;
        }
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

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.ActionCommandPayloads,
      data: { payloads },
    });

    return outbox;
  }

  getNextActionIntentAndUser(): ActionIntentOptionAndUser {
    const { game, party, battle } = this;
    // get action intents for conditions or ai combatants
    battle.turnOrderManager.updateTrackers(game, party);
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    return fastestActorTurnTracker.getNextActionIntentAndUser(game, party, battle);
  }

  async handleBattleConclusion(partyWipes: PartyWipes) {
    const { game, party } = this;
    const actionCommandPayloads: ActionCommandPayload[] = [];

    const conclusion = await getBattleConclusionCommandAndPayload(
      game,
      party,
      partyWipes,
      this.itemGenerator,
      this.rng,
      this.gameEventCommandReceiver
    );
    actionCommandPayloads.push(conclusion.payload);
    party.actionCommandQueue.enqueueNewCommands([conclusion.command]);
    const payloadsResult = await party.actionCommandQueue.processCommands();
    if (payloadsResult instanceof Error) return payloadsResult;
    actionCommandPayloads.push(...payloadsResult);
    const payloadsCommands = payloadsResult.map(
      (item) => new ActionCommand(game.name, item, this.gameEventCommandReceiver)
    );
    party.actionCommandQueue.enqueueNewCommands(payloadsCommands);
    await party.actionCommandQueue.processCommands();

    return actionCommandPayloads;
  }
}
