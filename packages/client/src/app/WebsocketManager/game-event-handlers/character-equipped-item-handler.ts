import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  AdventuringParty,
  CharacterAssociatedData,
  CombatantProperties,
  ERROR_MESSAGES,
  EquipItemPacket,
} from "@speed-dungeon/common";
import clientCharacterActionHandler from "../client-character-action-handler";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";

export default function characterEquippedItemHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  { characterId, itemId, equipToAlternateSlot }: EquipItemPacket
) {
  clientCharacterActionHandler(
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
      if (itemToSelectOption === null) return;
      const itemToSelect = itemToSelectOption;

      gameState.hoveredEntity = null;
      gameState.detailedEntity = { item: itemToSelect, type: DetailableEntityType.Item };
    }
  );
}
