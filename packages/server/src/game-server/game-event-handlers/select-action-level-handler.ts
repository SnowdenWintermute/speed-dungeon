import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
  CombatantProperties,
  ERROR_MESSAGES,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";
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

  const { character, game, party } = characterAssociatedData;
  const { selectedCombatAction, ownedActions } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    selectedCombatAction,
    newSelectedActionLevel
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  const actionStateOption = ownedActions[selectedCombatAction];
  if (actionStateOption === undefined) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);

  character.combatantProperties.selectedActionLevel = newSelectedActionLevel;

  console.log("selected action level:", newSelectedActionLevel);

  // check if current targets are still valid at this level
  // if not, assign initial targets

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterSelectedCombatActionLevel, {
      characterId: character.entityProperties.id,
      actionLevel: newSelectedActionLevel,
    });
}
