import cloneDeep from "lodash.clonedeep";
import { ActionAndRank } from "../../../../action-user-context/action-user-targeting-properties.js";
import { ActionUserContext } from "../../../../action-user-context/index.js";
import { ActionRank, CombatantId } from "../../../../aliases.js";
import { TargetingCalculator } from "../../../../combat/targeting/targeting-calculator.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { UserSession } from "../../../sessions/user-session.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { COMBAT_ACTIONS } from "../../../../combat/combat-actions/action-implementations/index.js";
import { NextOrPrevious } from "../../../../primatives/index.js";
import { CombatActionExecutionIntent } from "../../../../combat/combat-actions/combat-action-execution-intent.js";
import { CharacterAssociatedData } from "../../../../types.js";
import { CombatActionTarget } from "../../../../combat/targeting/combat-action-targets.js";
import {
  ActionCommandPayload,
  ActionCommandType,
  CombatActionReplayTreePayload,
} from "../../../../action-processing/index.js";
import { BattleProcessor } from "../battle-processor/index.js";
import { processCombatAction } from "../../../../action-processing/process-combat-action.js";
import { IdGenerator } from "../../../../utility-classes/index.js";
import { ItemGenerator } from "../../../../items/item-creation/index.js";
import { RandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { ActionCommandReceiver } from "../../../../action-processing/action-command-receiver.js";
import { AssetAnalyzer } from "../../asset-analyzer/index.js";

export class CombatActionController {
  constructor(
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private idGenerator: IdGenerator,
    private itemGenerator: ItemGenerator,
    private rng: RandomNumberGenerator,
    private gameEventCommandReceiver: ActionCommandReceiver,
    private assetAnalyzer: AssetAnalyzer
  ) {}

  selectCombatActionHandler(
    session: UserSession,
    data: {
      characterId: CombatantId;
      actionAndRankOption: ActionAndRank | null;
      itemIdOption?: string;
    }
  ) {
    const { characterId, actionAndRankOption, itemIdOption } = data;

    const { game, party, player, character } = session.requireCharacterContext(characterId, {
      requireAlive: true,
      requireOwned: true,
    });

    const { abilityProperties } = character.combatantProperties;

    if (actionAndRankOption !== null) {
      const combatActionPropertiesResult =
        abilityProperties.getCombatActionPropertiesIfOwned(actionAndRankOption);
      if (combatActionPropertiesResult instanceof Error) {
        throw combatActionPropertiesResult;
      }
    }

    const targetingProperties = character.getTargetingProperties();
    targetingProperties.setSelectedActionAndRank(actionAndRankOption);

    if (itemIdOption !== undefined) {
      // @INFO - if we want to allow selecting equipped items or unowned items
      // change this
      // also it shouldn't matter if they can select an unowned item since we
      // check if they own it on reading skill books, which is the only thing
      // this is currently used for
      const ownedItemResult = character.combatantProperties.inventory.getItemById(itemIdOption);
      if (ownedItemResult instanceof Error) {
        throw ownedItemResult;
      }
    }

    targetingProperties.setSelectedItemId(itemIdOption || null);

    const targetingCalculator = new TargetingCalculator(
      new ActionUserContext(game, party, character),
      player
    );

    const initialTargetsResult =
      targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);

    if (initialTargetsResult instanceof Error) {
      targetingProperties.clear();
      throw initialTargetsResult;
    }

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterSelectedCombatAction,
      data: {
        characterId,
        actionAndRankOption,
        itemIdOption,
      },
    });

    return outbox;
  }

  selectCombatActionRankHandler(
    session: UserSession,
    data: {
      characterId: CombatantId;
      actionRank: ActionRank;
    }
  ) {
    const { actionRank, characterId } = data;

    const { game, party, player, character } = session.requireCharacterContext(characterId, {
      requireAlive: true,
      requireOwned: true,
    });
    const targetingProperties = character.getTargetingProperties();
    const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();

    if (selectedActionAndRankOption === null) {
      throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
    }

    const { abilityProperties, resources } = character.combatantProperties;

    const combatActionPropertiesResult = abilityProperties.getCombatActionPropertiesIfOwned(
      selectedActionAndRankOption
    );
    if (combatActionPropertiesResult instanceof Error) {
      throw combatActionPropertiesResult;
    }
    const { actionName } = selectedActionAndRankOption;

    const actionStateOption = abilityProperties.getOwnedActionOption(actionName);
    if (actionStateOption === undefined) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);
    }

    const actionAndNewlySelectedRank = new ActionAndRank(actionName, actionRank);

    const action = COMBAT_ACTIONS[actionName];
    const costs = action.costProperties.getResourceCosts(character, !!party.battleId, actionRank);
    const unmetResourceTypes = resources.getUnmetCostResourceTypes(costs);
    const hasRequiredResources = !unmetResourceTypes.length;

    if (!hasRequiredResources) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
    }

    targetingProperties.setSelectedActionAndRank(actionAndNewlySelectedRank);

    character.combatantProperties.targetingProperties = cloneDeep(targetingProperties);

    // check if current targets are still valid at this rank
    const actionUserContext = new ActionUserContext(game, party, character);
    const targetingCalculator = new TargetingCalculator(actionUserContext, player);
    targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterSelectedCombatActionRank,
      data: {
        characterId,
        actionRank,
      },
    });

    return outbox;
  }

  cycleTargetsHandler(
    session: UserSession,
    data: { characterId: CombatantId; direction: NextOrPrevious }
  ) {
    const { characterId, direction } = data;
    const { game, party, player, character } = session.requireCharacterContext(characterId, {
      requireAlive: true,
      requireOwned: true,
    });

    const targetingCalculator = new TargetingCalculator(
      new ActionUserContext(game, party, character),
      player
    );

    const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();
    const targetingProperties = character.getTargetingProperties();
    targetingProperties.cycleTargets(direction, player, validTargetsByDisposition);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterCycledTargets,
      data: { characterId, direction },
    });

    return outbox;
  }

  cycleTargetingSchemesHandler(session: UserSession, data: { characterId: CombatantId }) {
    const { characterId } = data;
    const { game, party, player, character } = session.requireCharacterContext(characterId, {
      requireAlive: true,
      requireOwned: true,
    });

    const targetingCalculator = new TargetingCalculator(
      new ActionUserContext(game, party, character),
      player
    );

    const targetingProperties = character.getTargetingProperties();

    targetingProperties.cycleTargetingSchemes(targetingCalculator);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.CharacterCycledTargetingSchemes,
      data: { characterId },
    });

    return outbox;
  }

  async useSelectedCombatActionHandler(session: UserSession, data: { characterId: CombatantId }) {
    const { characterId } = data;
    const characterContext = session.requireCharacterContext(characterId, {
      requireAlive: true,
      requireOwned: true,
    });

    const validTargetsAndActionNameResult = this.validateClientActionUseRequest(characterContext);

    const { actionAndRank, targets } = validTargetsAndActionNameResult;
    const { actionName, rank } = actionAndRank;

    const actionExecutionIntent = new CombatActionExecutionIntent(actionName, rank, targets);

    this.updateCharacterTargetingPreferencesOnActionExecution(characterContext, targets);

    const outbox = await this.executeAction(characterContext, actionExecutionIntent, true);
    return outbox;
  }

  private validateClientActionUseRequest(characterContext: CharacterAssociatedData) {
    const { game, party, character } = characterContext;

    party.requireInputUnlocked();

    const targetingProperties = character.getTargetingProperties();

    const targets = targetingProperties.getSelectedTarget();
    if (targets === null) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
    }

    const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();
    if (selectedActionAndRankOption === null) {
      throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
    }

    const maybeError = character.canUseAction(selectedActionAndRankOption, game, party);
    if (maybeError instanceof Error) {
      throw maybeError;
    }

    return { actionAndRank: selectedActionAndRankOption, targets };
  }

  private updateCharacterTargetingPreferencesOnActionExecution(
    characterContext: CharacterAssociatedData,
    targets: CombatActionTarget
  ) {
    const { character, game, party } = characterContext;
    // we only want to update a character's target preferences on execution, unlike how a player's
    // preferences are updated on cycle or action selection, because this is currently only used for
    // their pet to attack the last hostile they targeted. If we update on cycle, the character could cycle
    // past a hostile target while trying to target something else, then whatever the last hostile they targeted
    // would be the pet's target, instead of what the character last attacked.
    const targetingCalculator = new TargetingCalculator(
      new ActionUserContext(game, party, character),
      null
    );
    const validTargetsByDisposition = targetingCalculator.getValidTargetsByDisposition();
    const { targetingProperties } = character.combatantProperties;
    targetingProperties.updatePreferences(targets, validTargetsByDisposition);
  }

  async executeAction(
    characterContext: CharacterAssociatedData,
    actionExecutionIntent: CombatActionExecutionIntent,
    lockInuptWhileReplaying: boolean
  ) {
    const { game, party, character } = characterContext;
    const actionUserContext = new ActionUserContext(game, party, character);

    const replayTreeResult = processCombatAction(
      actionExecutionIntent,
      actionUserContext,
      this.idGenerator,
      this.assetAnalyzer.animationLengths,
      this.assetAnalyzer.boundingBoxes
    );

    if (replayTreeResult instanceof Error) {
      throw replayTreeResult;
    }

    const battleOption = party.battleId ? game.battles[party.battleId] || null : null;

    const replayTreePayload: CombatActionReplayTreePayload = {
      type: ActionCommandType.CombatActionReplayTree,
      actionUserId: character.entityProperties.id,
      root: replayTreeResult.rootReplayNode,
    };

    if (!lockInuptWhileReplaying) {
      replayTreePayload.doNotLockInput = true;
    }

    const payloads: ActionCommandPayload[] = [replayTreePayload];

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    outbox.pushToChannel(getPartyChannelName(game.name, party.name), {
      type: GameStateUpdateType.ActionCommandPayloads,
      data: { payloads },
    });

    if (battleOption) {
      const battleProcessor = new BattleProcessor(
        this.updateDispatchFactory,
        game,
        party,
        battleOption,
        this.idGenerator,
        this.itemGenerator,
        this.rng,
        this.gameEventCommandReceiver,
        this.assetAnalyzer
      );

      const battleProcessingOutbox =
        await battleProcessor.processBattleUntilPlayerTurnOrConclusion();
      outbox.pushFromOther(battleProcessingOutbox);
    }

    return outbox;
  }
}
