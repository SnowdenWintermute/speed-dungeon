import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { CombatActionName } from "@speed-dungeon/common";
import { TargetingCalculator } from "@speed-dungeon/common";

export function selectCombatActionHandler(
  eventData: {
    characterId: string;
    combatActionNameOption: null | CombatActionName;
    combatActionLevel: null | number;
    itemIdOption?: string;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  let { combatActionNameOption, combatActionLevel, itemIdOption } = eventData;

  const { character, game, party, player } = characterAssociatedData;
  let combatActionOption: null | CombatActionComponent = null;
  if (combatActionNameOption !== null && combatActionLevel !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      combatActionNameOption,
      combatActionLevel
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionOption = combatActionPropertiesResult;
  }

  character.combatantProperties.selectedCombatAction = combatActionNameOption;
  character.combatantProperties.selectedActionLevel = combatActionLevel;
  character.combatantProperties.selectedItemId = itemIdOption || null;

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, character),
    player
  );
  const initialTargetsResult =
    targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);

  if (initialTargetsResult instanceof Error) {
    character.combatantProperties.selectedCombatAction = null;
    character.combatantProperties.selectedActionLevel = null;
    return initialTargetsResult;
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionNameOption,
      combatActionLevel,
      itemIdOption
    );
}
