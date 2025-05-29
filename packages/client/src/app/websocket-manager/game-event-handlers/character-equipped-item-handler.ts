import { GameState, getCurrentMenu } from "@/stores/game-store";
import {
  AdventuringParty,
  CharacterAssociatedData,
  CombatantEquipment,
  CombatantProperties,
  ERROR_MESSAGES,
  Item,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";
import cloneDeep from "lodash.clonedeep";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export function characterEquippedItemHandler(packet: {
  itemId: string;
  equipToAlternateSlot: boolean;
  characterId: string;
}) {
  const { itemId, equipToAlternateSlot, characterId } = packet;
  let itemToSelectOption: Item | null = null;

  characterAssociatedDataProvider(
    characterId,
    ({ party, character }: CharacterAssociatedData, gameState: GameState) => {
      if (gameState.username === null) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

      const unequippedResult = CombatantProperties.equipItem(
        character.combatantProperties,
        itemId,
        equipToAlternateSlot
      );
      if (unequippedResult instanceof Error) return unequippedResult;
      const { idsOfUnequippedItems } = unequippedResult;

      const slot = CombatantProperties.getSlotItemIsEquippedTo(
        character.combatantProperties,
        itemId
      );
      if (slot !== null) {
        const item = CombatantEquipment.getEquipmentInSlot(character.combatantProperties, slot);
        if (item !== undefined)
          getGameWorld().modelManager.modelActionQueue.enqueueMessage({
            type: ModelActionType.SynchronizeCombatantEquipmentModels,
            entityId: character.entityProperties.id,
          });
      }

      if (idsOfUnequippedItems[0] === undefined) return;

      const playerOwnsCharacter = AdventuringParty.playerOwnsCharacter(
        party,
        gameState.username,
        characterId
      );

      if (!playerOwnsCharacter) return;

      // we want the user to be now selecting the item they just unequipped
      for (const item of character.combatantProperties.inventory.equipment) {
        if (item.entityProperties.id === idsOfUnequippedItems[0]) {
          itemToSelectOption = item;
          break;
        }
      }

      gameState.hoveredEntity = null;
      if (itemToSelectOption === null) return;

      const currentMenu = getCurrentMenu(gameState);
      if (currentMenu instanceof ConsideringItemMenuState) {
        // not cloning here leads to zustand revoked proxy error
        currentMenu.item = cloneDeep(itemToSelectOption);
        gameState.detailedEntity = cloneDeep(itemToSelectOption);
      }
    }
  );
}
