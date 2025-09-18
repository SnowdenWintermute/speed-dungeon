import {
  ACTION_ENTITY_ACTION_INTENT_GETTERS,
  AISelectActionAndTarget,
  ActionCommand,
  ActionCommandPayload,
  ActionCommandType,
  AdventuringParty,
  Battle,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  CombatActionReplayTreePayload,
  Combatant,
  CombatantCondition,
  CombatantContext,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  TaggedActionEntityTurnTrackerActionEntityId,
  TaggedCombatantTurnTrackerCombatantId,
  TaggedConditionTurnTrackerConditionAndCombatantId,
  TurnTrackerEntityType,
  createShimmedUserOfActionEntityAction,
  getPartyChannelName,
  throwIfError,
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

    battle.turnOrderManager.updateTrackers(game, party);
    let currentActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    const payloads: ActionCommandPayload[] = [];

    while (currentActorTurnTracker) {
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

      console.log("AI SELECTED:", actionExecutionIntent);

      // process action intents
      let shouldEndTurn = false;
      if (actionExecutionIntent === null) {
        console.info("AI action intent was null");
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
    battle.turnOrderManager.updateTrackers(game, party);
    const fastestActorTurnTracker = battle.turnOrderManager.getFastestActorTurnOrderTracker();

    const taggedTurnTrackerEntityId = fastestActorTurnTracker.getTaggedIdOfTrackedEntity();

    // @REFACTOR
    switch (taggedTurnTrackerEntityId.type) {
      case TurnTrackerEntityType.Condition:
        return getNextActionIntentAndUserForCondition(
          game,
          party,
          battle,
          taggedTurnTrackerEntityId
        );
      case TurnTrackerEntityType.Combatant:
        return getNextActionIntentAndUserForCombatant(
          game,
          party,
          battle,
          taggedTurnTrackerEntityId
        );
      case TurnTrackerEntityType.ActionEntity:
        return getNextActionIntentAndUserForActionEntity(
          game,
          party,
          battle,
          taggedTurnTrackerEntityId
        );
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

// @REFACTOR

function getNextActionIntentAndUserForCombatant(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battle: Battle,
  taggedTurnTrackerEntityId: TaggedCombatantTurnTrackerCombatantId
) {
  const { combatantId } = taggedTurnTrackerEntityId;
  const activeCombatantResult = AdventuringParty.getExpectedCombatant(party, combatantId);
  if (activeCombatantResult instanceof Error) throw activeCombatantResult;
  let { entityProperties } = activeCombatantResult;

  const battleGroupsResult = Battle.getAllyAndEnemyBattleGroups(battle, entityProperties.id);
  if (battleGroupsResult instanceof Error) throw battleGroupsResult;

  const actionExecutionIntent = AISelectActionAndTarget(game, activeCombatantResult);
  if (actionExecutionIntent instanceof Error) throw actionExecutionIntent;
  return { actionExecutionIntent, user: activeCombatantResult };
}

function getNextActionIntentAndUserForCondition(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battle: Battle,
  taggedTurnTrackerEntityId: TaggedConditionTurnTrackerConditionAndCombatantId
) {
  const { combatantId, conditionId } = taggedTurnTrackerEntityId;
  const condition = throwIfError(
    AdventuringParty.getConditionOnCombatant(party, combatantId, conditionId)
  );
  const combatant = AdventuringParty.getExpectedCombatant(party, combatantId);
  const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
  if (tickPropertiesOption === undefined)
    throw new Error("expected condition tick properties were missing");
  const onTick = tickPropertiesOption.onTick(
    condition,
    new CombatantContext(game, party, combatant)
  );

  const { actionExecutionIntent, user } = onTick.triggeredAction;
  return { actionExecutionIntent, user };
}

function getNextActionIntentAndUserForActionEntity(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battle: Battle,
  taggedTurnTrackerEntityId: TaggedActionEntityTurnTrackerActionEntityId
): {
  actionExecutionIntent: CombatActionExecutionIntent;
  user: Combatant;
} {
  const { actionEntityId } = taggedTurnTrackerEntityId;
  const actionEntityResult = AdventuringParty.getActionEntity(party, actionEntityId);
  if (actionEntityResult instanceof Error) throw actionEntityResult;

  const actionIntentGetterOption =
    ACTION_ENTITY_ACTION_INTENT_GETTERS[actionEntityResult.actionEntityProperties.name];
  if (actionIntentGetterOption === undefined)
    throw new Error(
      "expected an action entity with a turn tracker to have an actionIntentGetterOption"
    );

  const actionExecutionIntent = actionIntentGetterOption();

  const dummyUser = createShimmedUserOfActionEntityAction(
    actionEntityResult.entityProperties.name,
    actionEntityResult,
    actionEntityResult.entityProperties.id
  );

  return {
    actionExecutionIntent,
    user: dummyUser,
  };
}
