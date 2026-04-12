import {
  ActionIntentAndUser,
  ActionIntentOptionAndUser,
} from "../../../../action-processing/action-steps/index.js";
import { processCombatAction } from "../../../../action-processing/process-combat-action.js";
import { ActionUserContext } from "../../../../action-user-context/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { LOOP_SAFETY_ITERATION_LIMIT } from "../../../../app-consts.js";
import { Battle, BattleConclusion } from "../../../../battle/index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { GameMode } from "../../../../types.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../../../../utility-classes/random-number-generation-policy.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { LootGenerator } from "../../../../items/item-creation/loot-generator.js";
import { AssetAnalyzer } from "../../asset-analyzer/index.js";
import {
  createPartyWipeMessage,
  GameMessage,
  GameMessageType,
} from "../../../../packets/game-message.js";
import { GameModeContext } from "../game-lifecycle/game-mode-context.js";
import {
  ClientSequentialEvent,
  ClientSequentialEventType,
} from "../../../../packets/client-sequential-events.js";
import { COMBAT_ACTIONS } from "../../../../combat/combat-actions/action-implementations/index.js";
import { throwIfLoopLimitReached } from "../../../../utils/index.js";
import { CombatActionExecutionIntent } from "../../../../combat/combat-actions/combat-action-execution-intent.js";
import { IActionUser } from "../../../../action-user-context/action-user.js";

export class BattleProcessor {
  constructor(
    private updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private battle: Battle,
    private gameModeContexts: Record<GameMode, GameModeContext>,
    private idGenerator: IdGenerator,
    private rngPolicy: RandomNumberGenerationPolicy,
    private lootGenerator: LootGenerator,
    private assetAnalyzer: AssetAnalyzer
  ) {}

  async processBattleUntilPlayerTurnOrConclusion() {
    const { game, party, battle } = this;
    battle.turnOrderManager.updateTrackers(game, party);

    const sequentialEvents: ClientSequentialEvent[] = [];

    let safetyCounter = -1;
    while (party.battleId) {
      throwIfLoopLimitReached(safetyCounter, "process-battle-until-player-turn-or-conclusion");
      safetyCounter += 1;

      battle.turnOrderManager.updateTrackers(game, party);
      console.log("updated trackers", battle.turnOrderManager.getTrackers());
      const fastestTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();
      // battle ended (resolved by a BattleResolution step in the previous action), stop processing
      if (party.battleId === null) break;
      if (battle.turnOrderManager.currentActorIsPlayerControlled(party)) {
        console.log("stop processing - is turn of player controlled combatant", fastestTracker);
        break;
      }

      const { actionExecutionIntent, user } = fastestTracker.getNextActionIntentAndUser(
        game,
        party,
        this.rngPolicy
      );
      this.logSelectedActionIntent(user, actionExecutionIntent);

      // process action intents
      if (actionExecutionIntent === null) {
        console.info("AI action intent was null");
      } else {
        const replayTreeResult = processCombatAction(
          actionExecutionIntent,
          new ActionUserContext(game, party, user),
          this.idGenerator,
          this.rngPolicy,
          this.assetAnalyzer.animationLengths,
          this.assetAnalyzer.boundingBoxes,
          this.lootGenerator
        );

        if (replayTreeResult instanceof Error) {
          throw replayTreeResult;
        }
        const { rootReplayNode, battleConcludedOption } = replayTreeResult;

        const actionUserId = user.getEntityId();
        const payload: ClientSequentialEvent = {
          type: ClientSequentialEventType.ProcessReplayTree,
          data: {
            actionUserId,
            root: rootReplayNode,
          },
        };

        sequentialEvents.push(payload);

        if (battleConcludedOption !== null) {
          const postConclusionEvents = await this.handlePostBattleConclusion(battleConcludedOption);
          sequentialEvents.push(...postConclusionEvents);
        }
      }
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.ClientSequentialEvents,
      data: { sequentialEvents },
    });

    return outbox;
  }

  logSelectedActionIntent(
    user: IActionUser,
    actionExecutionIntentOption: null | CombatActionExecutionIntent
  ) {
    const actionStringName = actionExecutionIntentOption
      ? COMBAT_ACTIONS[actionExecutionIntentOption.actionName].getStringName()
      : "null";
    console.info(
      `actionExecutionIntent: ${actionStringName} user: ${user.getName()} ${user.getEntityId()}`
    );
  }

  // getNextActionIntentAndUser(fastestTracker:TurnTracker): ActionIntentOptionAndUser {
  //   const { game, party, battle } = this;

  //   return fastestTracker.getNextActionIntentAndUser(game, party, this.rngPolicy);
  // }

  async handlePostBattleConclusion(battleConcluded: {
    conclusion: BattleConclusion;
    levelUps: Record<string, number>;
  }) {
    const { game, party } = this;
    const sequentialEvents: ClientSequentialEvent[] = [];

    const gameModeContext = this.gameModeContexts[game.mode];
    await gameModeContext.strategy.onBattleResult(game, party);

    switch (battleConcluded.conclusion) {
      case BattleConclusion.Defeat: {
        const floorNumber = party.dungeonExplorationManager.getCurrentFloor();

        sequentialEvents.push({
          type: ClientSequentialEventType.PostGameMessages,
          data: {
            messages: [
              new GameMessage(
                GameMessageType.PartyWipe,
                true,
                createPartyWipeMessage(party.name, floorNumber, new Date())
              ),
            ],
            partyChannelToExclude: getPartyChannelName(game.name, party.name),
          },
        });

        const defeatMessagePayloadResults = await gameModeContext.strategy.onPartyWipe(game, party);
        if (defeatMessagePayloadResults instanceof Error) throw defeatMessagePayloadResults;
        if (defeatMessagePayloadResults) sequentialEvents.push(...defeatMessagePayloadResults);
        break;
      }
      case BattleConclusion.Victory: {
        const victoryMessagePayloadResults = await gameModeContext.strategy.onPartyVictory(
          game,
          party,
          battleConcluded.levelUps
        );
        if (victoryMessagePayloadResults instanceof Error) return victoryMessagePayloadResults;
        if (victoryMessagePayloadResults) sequentialEvents.push(...victoryMessagePayloadResults);
        break;
      }
    }

    return sequentialEvents;
  }
}
