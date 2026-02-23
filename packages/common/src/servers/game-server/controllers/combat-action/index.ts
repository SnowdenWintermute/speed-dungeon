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

export class CombatActionController {
  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}

  selectCombatActionHandler(
    session: UserSession,
    data: {
      characterId: string;
      actionAndRankOption: ActionAndRank | null;
      itemIdOption?: string;
    }
  ) {
    const { characterId, actionAndRankOption, itemIdOption } = data;

    const game = session.getExpectedCurrentGame();
    const party = session.getExpectedCurrentParty(game);
    const character = party.combatantManager.getExpectedCombatant(characterId);
    character.combatantProperties.controlledBy.requireOwnedBy(session.username);
    character.combatantProperties.requireAlive();

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

    const player = game.getExpectedPlayer(session.username);
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

    const game = session.getExpectedCurrentGame();
    const party = session.getExpectedCurrentParty(game);
    const character = party.combatantManager.getExpectedCombatant(characterId);
    character.combatantProperties.controlledBy.requireOwnedBy(session.username);
    character.combatantProperties.requireAlive();
    const targetingProperties = character.getTargetingProperties();
    const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();

    if (selectedActionAndRankOption === null) {
      throw new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
    }

    const { abilityProperties } = character.combatantProperties;

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
    const hasRequiredResources =
      !character.combatantProperties.resources.getUnmetCostResourceTypes(costs).length;

    if (!hasRequiredResources) {
      throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
    }

    targetingProperties.setSelectedActionAndRank(actionAndNewlySelectedRank);

    character.combatantProperties.targetingProperties = cloneDeep(targetingProperties);

    // check if current targets are still valid at this rank
    const actionUserContext = new ActionUserContext(game, party, character);
    const player = game.getExpectedPlayer(session.username);
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
}
