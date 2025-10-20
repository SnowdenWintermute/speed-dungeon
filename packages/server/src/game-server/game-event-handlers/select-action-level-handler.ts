import {
  ActionAndRank,
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { TargetingCalculator } from "@speed-dungeon/common";
import { ActionUserContext } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

export function selectCombatActionLevelHandler(
  eventData: {
    characterId: string;
    actionLevel: number;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  const { actionLevel: newSelectedActionLevel } = eventData;

  const { character, game, party, player } = characterAssociatedData;
  const targetingProperties = character.getTargetingProperties();
  const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();

  if (selectedActionAndRankOption === null) {
    return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
  }

  const { abilityProperties } = character.combatantProperties;
  const ownedActions = abilityProperties.getOwnedActions();

  const combatActionPropertiesResult = abilityProperties.getCombatActionPropertiesIfOwned(
    selectedActionAndRankOption
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  const { actionName } = selectedActionAndRankOption;

  const actionStateOption = ownedActions[actionName];
  if (actionStateOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);

  const actionAndNewlySelectedRank = new ActionAndRank(actionName, newSelectedActionLevel);

  const hasRequiredResources = CombatantProperties.hasRequiredResourcesToUseAction(
    character,
    actionAndNewlySelectedRank,
    !!party.battleId
  );

  if (!hasRequiredResources) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

  targetingProperties.setSelectedActionAndRank(actionAndNewlySelectedRank);

  character.combatantProperties.targetingProperties = cloneDeep(targetingProperties);

  // check if current targets are still valid at this level
  const actionUserContext = new ActionUserContext(game, party, character);
  const targetingCalculator = new TargetingCalculator(actionUserContext, player);
  targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel();

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterSelectedCombatActionLevel, {
      characterId: character.entityProperties.id,
      actionLevel: newSelectedActionLevel,
    });
}
