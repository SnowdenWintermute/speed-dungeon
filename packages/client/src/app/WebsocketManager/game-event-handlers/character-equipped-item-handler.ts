import { GameState } from "@/stores/game-store";
import {
  AdventuringParty,
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterEquippedItemHandler({
  characterId,
  itemId,
  equipToAlternateSlot,
}: {
  itemId: string;
  equipToAlternateSlot: boolean;
  characterId: string;
}) {
  let itemToSelectOption: Item | null = null;

  characterAssociatedDataProvider(
    characterId,
    ({ party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (gameState.username === null) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

      const unequippedItemIdsResult = CombatantProperties.equipItem(
        character.combatantProperties,
        itemId,
        equipToAlternateSlot
      );
      if (unequippedItemIdsResult instanceof Error) return unequippedItemIdsResult;

      if (unequippedItemIdsResult[0] !== undefined) {
        for (const item of character.combatantProperties.inventory.items) {
          if (item.entityProperties.id === unequippedItemIdsResult[0]) itemToSelectOption = item;
        }
      }

      const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
        party,
        gameState.username,
        characterId
      );

      gameState.hoveredEntity = null;
      if (!playerOwnsCharacter) return;
      if (itemToSelectOption === null) return;

      // gameState.detailedEntity = { item: itemToSelect, type: DetailableEntityType.Item };
    }
  );

  // if (itemToSelectOption !== null) {
  //   useGameStore.getState().mutateState((state) => {
  //     state.stackedMenuStates[state.stackedMenuStates.length - 1] = new ConsideringItemMenuState(
  //       itemToSelectOption!
  //     );
  //   });
  // }
}
