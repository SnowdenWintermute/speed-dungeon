import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
  CombatantProperties,
  Inventory,
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
  if (itemIdOption !== undefined) {
    // @INFO - if we want to allow selecting equipped items or unowned items
    // change this
    // also it shouldn't matter if they can select an unowned item since we
    // check if they own it on reading skill books, which is the only thing
    // this is currently used for
    const ownedItemResult = Inventory.getItemById(
      character.combatantProperties.inventory,
      itemIdOption
    );
    if (ownedItemResult instanceof Error) return ownedItemResult;
  }
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
