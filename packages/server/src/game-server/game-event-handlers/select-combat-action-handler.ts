import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
  CombatantProperties,
  Inventory,
  Option,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { TargetingCalculator } from "@speed-dungeon/common";
import { ActionAndRank } from "@speed-dungeon/common/src/combatant-context/action-user-targeting-properties.js";

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
  let combatActionOption: null | CombatActionComponent = null;

  if (actionAndRankOption !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      actionAndRankOption
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionOption = combatActionPropertiesResult;
  }

  const targetingProperties = character.getTargetingProperties();
  targetingProperties.setSelectedActionAndRank(actionAndRankOption);

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

  targetingProperties.setSelectedItemId(itemIdOption || null);

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, character),
    player
  );
  const initialTargetsResult =
    targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);

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
