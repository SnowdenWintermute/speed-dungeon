import { AlertState, useAlertStore } from "@/stores/alert-store";
import { GameState, useGameStore } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  AdventuringParty,
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";
import { useUIStore } from "@/stores/ui-store";

export default function characterEquippedItemHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  {
    characterId,
    itemId,
    equipToAlternateSlot,
  }: {
    itemId: string;
    equipToAlternateSlot: boolean;
    characterId: string;
  }
) {
  characterAssociatedDataProvider(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (gameState.username === null) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

      const unequippedItemIdsResult = CombatantProperties.equipItem(
        character.combatantProperties,
        itemId,
        equipToAlternateSlot
      );
      if (unequippedItemIdsResult instanceof Error) return unequippedItemIdsResult;

      let itemToSelectOption = null;

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

      if (!playerOwnsCharacter) return;
      if (itemToSelectOption === null) {
        gameState.stackedMenuStates.pop();
        return;
      }
      const itemToSelect = itemToSelectOption;

      gameState.hoveredEntity = null;
      // gameState.detailedEntity = { item: itemToSelect, type: DetailableEntityType.Item };
      gameState.stackedMenuStates[gameState.stackedMenuStates.length - 1] =
        new ConsideringItemMenuState(
          useGameStore.getState(),
          useUIStore.getState(),
          useAlertStore.getState(),
          itemToSelect
        );
    }
  );
}
