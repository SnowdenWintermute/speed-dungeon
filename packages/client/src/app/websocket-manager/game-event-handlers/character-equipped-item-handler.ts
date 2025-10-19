import { CharacterAssociatedData, CombatantProperties, Item } from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";
import cloneDeep from "lodash.clonedeep";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

export function characterEquippedItemHandler(packet: {
  itemId: string;
  equipToAlternateSlot: boolean;
  characterId: string;
}) {
  const { itemId, equipToAlternateSlot, characterId } = packet;
  let itemToSelectOption: Item | null = null;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const unequippedResult = CombatantProperties.equipItem(character, itemId, equipToAlternateSlot);
    if (unequippedResult instanceof Error) return unequippedResult;
    const { idsOfUnequippedItems } = unequippedResult;

    const slot = character.combatantProperties.equipment.getSlotItemIsEquippedTo(itemId);
    if (slot !== null) {
      const item = character.combatantProperties.equipment.getEquipmentInSlot(slot);
      if (item !== undefined)
        getGameWorld().modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SynchronizeCombatantEquipmentModels,
          entityId: character.entityProperties.id,
        });
    }

    if (idsOfUnequippedItems[0] === undefined) return;

    const playerOwnsCharacter = party.combatantManager.playerOwnsCharacter(
      AppStore.get().gameStore.getExpectedUsername(),
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

    const { focusStore } = AppStore.get();
    focusStore.detailables.clearHovered();

    if (itemToSelectOption === null) return;

    const { actionMenuStore } = AppStore.get();
    const currentMenu = actionMenuStore.getCurrentMenu();
    if (currentMenu instanceof ConsideringItemMenuState) {
      // not cloning here leads to zustand revoked proxy error
      // maybe once we don't use zustand we can try not cloning
      currentMenu.item = cloneDeep(itemToSelectOption);
      focusStore.detailables.setDetailed(cloneDeep(itemToSelectOption));
    }
  });
}
