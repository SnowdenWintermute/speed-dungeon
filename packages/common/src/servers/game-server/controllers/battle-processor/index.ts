import { ActionIntentOptionAndUser } from "../../../../action-processing/action-steps/index.js";
import { processCombatAction } from "../../../../action-processing/process-combat-action.js";
import { ActionUserContext } from "../../../../action-user-context/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { LOOP_SAFETY_ITERATION_LIMIT } from "../../../../app-consts.js";
import { Battle, BattleConclusion } from "../../../../battle/index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { GameMode, PartyWipes } from "../../../../types.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { RandomNumberGenerationPolicy } from "../../../../utility-classes/random-number-generation-policy.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { LootGenerator } from "../../../../items/item-creation/loot-generator.js";
import { AssetAnalyzer } from "../../asset-analyzer/index.js";
import { Equipment } from "../../../../items/equipment/index.js";
import { Consumable } from "../../../../items/consumables/index.js";
import { CombatantId } from "../../../../aliases.js";
import { generateExperiencePoints } from "./generate-experience-points.js";
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
import { invariant } from "../../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../../../combat/combat-actions/action-implementations/index.js";

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
    let currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    const sequentialEvents: ClientSequentialEvent[] = [];

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
        const battleConclusionClientSequentialEvents =
          await this.handleBattleConclusion(partyWipes);
        sequentialEvents.push(...battleConclusionClientSequentialEvents);
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

      const actionStringName = actionExecutionIntent
        ? COMBAT_ACTIONS[actionExecutionIntent.actionName].getStringName()
        : "null";
      console.info("actionExecutionIntent:", actionStringName, "user:", user.getName());

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
          this.assetAnalyzer.boundingBoxes
        );

        if (replayTreeResult instanceof Error) {
          throw replayTreeResult;
        }
        const { rootReplayNode } = replayTreeResult;

        const actionUserId = user.getEntityId();
        const payload: ClientSequentialEvent = {
          type: ClientSequentialEventType.ProcessReplayTree,
          data: {
            actionUserId,
            root: rootReplayNode,
          },
        };

        sequentialEvents.push(payload);
      }

      currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();
      console.log("current actor:", currentActorTurnTracker.getId());
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.ClientSequentialEvents,
      data: { sequentialEvents },
    });

    console.log("returned outbox");

    return outbox;
  }

  getNextActionIntentAndUser(): ActionIntentOptionAndUser {
    const { game, party, battle } = this;
    // get action intents for conditions or ai combatants
    battle.turnOrderManager.updateTrackers(game, party);
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    return fastestActorTurnTracker.getNextActionIntentAndUser(game, party, this.rngPolicy);
  }

  async handleBattleConclusion(partyWipes: PartyWipes) {
    const { game, party } = this;
    const sequentialEvents: ClientSequentialEvent[] = [];

    const conclusionPayload = await this.getBattleConclusionPayload(partyWipes);
    sequentialEvents.push(conclusionPayload);

    const gameModeContext = this.gameModeContexts[game.mode];
    await gameModeContext.strategy.onBattleResult(game, party);

    invariant(conclusionPayload.type === ClientSequentialEventType.ProcessBattleResult);

    switch (conclusionPayload.data.conclusion) {
      case BattleConclusion.Defeat:
        {
          if (party.battleId !== null) {
            game.battles.delete(party.battleId);
          }
          party.setBattleId(null);

          party.timeOfWipe = Date.now();

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

          const defeatMessagePayloadResults = await gameModeContext.strategy.onPartyWipe(
            game,
            party
          );
          if (defeatMessagePayloadResults instanceof Error) {
            throw defeatMessagePayloadResults;
          }
          if (defeatMessagePayloadResults) {
            sequentialEvents.push(...defeatMessagePayloadResults);
          }
        }
        break;
      case BattleConclusion.Victory:
        {
          const { levelUps, branchingActions, conditionIdsRemoved } = Battle.handleVictory(
            game,
            party,
            conclusionPayload.data.experiencePointChanges,
            conclusionPayload.data.loot
          );
          const victoryMessagePayloadResults = await gameModeContext.strategy.onPartyVictory(
            game,
            party,
            levelUps
          );
          if (victoryMessagePayloadResults instanceof Error) return victoryMessagePayloadResults;
          if (victoryMessagePayloadResults) sequentialEvents.push(...victoryMessagePayloadResults);
        }
        break;
    }

    return sequentialEvents;
  }

  private async getBattleConclusionPayload(partyWipes: PartyWipes): Promise<ClientSequentialEvent> {
    const { party } = this;
    let conclusion: BattleConclusion;
    let loot: { equipment: Equipment[]; consumables: Consumable[] } = {
      equipment: [],
      consumables: [],
    };

    let experiencePointChanges: Record<CombatantId, number> = {};

    if (partyWipes.alliesDefeated) {
      conclusion = BattleConclusion.Defeat;
    } else {
      conclusion = BattleConclusion.Victory;
      loot = this.lootGenerator.generateLoot(
        party.combatantManager.getDungeonControlledCombatants().length,
        party.dungeonExplorationManager.getCurrentFloor()
      );
      experiencePointChanges = generateExperiencePoints(party);

      party.inputLock.unlockInput();
    }

    const { actionEntityManager } = party;
    const actionEntitiesRemoved =
      actionEntityManager.unregisterActionEntitiesOnBattleEndOrNewRoom();

    const payload: ClientSequentialEvent = {
      type: ClientSequentialEventType.ProcessBattleResult,
      data: {
        conclusion,
        loot: loot,
        partyName: party.name,
        experiencePointChanges,
        actionEntitiesRemoved,
        timestamp: Date.now(),
      },
    };

    return payload;
  }
}
