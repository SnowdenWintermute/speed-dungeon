import { CharacterAssociatedData, Item } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

export function characterEquippedItemHandler(packet: {
  itemId: string;
  equipToAlternateSlot: boolean;
  characterId: string;
}) {
  const { itemId, equipToAlternateSlot, characterId } = packet;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const { equipment } = character.combatantProperties;

    const unequippedResult = equipment.equipItem(itemId, equipToAlternateSlot);
    if (unequippedResult instanceof Error) return unequippedResult;
    const { idsOfUnequippedItems } = unequippedResult;

    const slot = equipment.getSlotItemIsEquippedTo(itemId);
    if (slot !== null) {
      const item = equipment.getEquipmentInSlot(slot);
      if (item !== undefined) {
        getGameWorld().modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SynchronizeCombatantEquipmentModels,
          entityId: character.entityProperties.id,
        });
      }
    }

    if (idsOfUnequippedItems[0] === undefined) return;

    const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
      AppStore.get().gameStore.getExpectedUsername(),
      characterId
    );

    if (!playerOwnsCharacter) return;

    const { focusStore } = AppStore.get();
    focusStore.detailables.clearHovered();

    // we want the user to be now selecting the item they just unequipped
    const equipmentInInventory = character.combatantProperties.inventory.equipment;
    const itemToSelectOption = equipmentInInventory.find(
      (equipment) => equipment.entityProperties.id === idsOfUnequippedItems[0]
    );
    if (itemToSelectOption === undefined) return;

    const { actionMenuStore } = AppStore.get();
    const currentMenu = actionMenuStore.getCurrentMenu();
    if (currentMenu instanceof ConsideringItemMenuState) {
      currentMenu.setItem(itemToSelectOption);
      focusStore.detailables.setDetailed(itemToSelectOption);
    }
  });
}
