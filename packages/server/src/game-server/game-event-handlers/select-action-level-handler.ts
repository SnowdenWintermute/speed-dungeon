import {
  CharacterAssociatedData,
  CombatantContext,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { TargetingCalculator } from "@speed-dungeon/common";

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
  const { ownedActions } = character.combatantProperties.abilityProperties;
  if (selectedActionAndRankOption === null)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    selectedActionAndRankOption
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  const { actionName } = selectedActionAndRankOption;

  const actionStateOption = ownedActions[actionName];
  if (actionStateOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);

  const actionAndNewlySelectedRank = { actionName, rank: newSelectedActionLevel };

  const hasRequiredResources = CombatantProperties.hasRequiredResourcesToUseAction(
    character.combatantProperties,
    actionAndNewlySelectedRank,
    !!party.battleId
  );

  if (!hasRequiredResources) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);

  targetingProperties.setSelectedActionAndRank(actionAndNewlySelectedRank);

  // check if current targets are still valid at this level
  const combatantContext = new CombatantContext(game, party, character);
  const targetingCalculator = new TargetingCalculator(combatantContext, player);
  targetingCalculator.updateTargetingSchemeAfterSelectingActionLevel(newSelectedActionLevel);

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterSelectedCombatActionLevel, {
      characterId: character.entityProperties.id,
      actionLevel: newSelectedActionLevel,
    });
}
