import {
  CharacterAssociatedData,
  Inventory,
  Option,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { TargetingCalculator } from "@speed-dungeon/common";
import { ActionAndRank } from "@speed-dungeon/common/src/action-user-context/action-user-targeting-properties.js";
import { ActionUserContext } from "@speed-dungeon/common";

export function selectCombatActionHandler(
  eventData: {
    characterId: string;
    actionAndRankOption: Option<ActionAndRank>;
    itemIdOption?: string;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  let { actionAndRankOption, itemIdOption } = eventData;

  const { character, game, party, player } = characterAssociatedData;

  const { abilityProperties } = character.combatantProperties;

  if (actionAndRankOption !== null) {
    const combatActionPropertiesResult =
      abilityProperties.getCombatActionPropertiesIfOwned(actionAndRankOption);
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
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
    if (ownedItemResult instanceof Error) return ownedItemResult;
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
    return initialTargetsResult;
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      actionAndRankOption,
      itemIdOption
    );
}
