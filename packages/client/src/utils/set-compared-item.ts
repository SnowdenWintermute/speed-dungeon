import { useGameStore } from "@/stores/game-store";
import { getItemInAdventuringParty } from "@speed-dungeon/common";
import { getPlayerPartyOption } from "@speed-dungeon/common";
import getFocusedCharacter from "./getFocusedCharacter";
import { EquipableSlots, ItemPropertiesType, getEquipableSlots } from "@speed-dungeon/common";

export default function setComparedItem(itemId: string, compareAltSlot: boolean) {
  useGameStore.getState().mutateState((gameState) => {
    if (!gameState.game || gameState.username === null) return;
    const partyResult = getPlayerPartyOption(gameState.game, gameState.username);
    if (partyResult instanceof Error) return console.error(partyResult);
    if (partyResult === undefined) return console.error("NO PARTY");
    const itemResult = getItemInAdventuringParty(partyResult, itemId);
    if (itemResult instanceof Error) return console.error(itemResult);
    const focusedCharacterResult = getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) return console.error(focusedCharacterResult);
    const focusedCharacter = focusedCharacterResult;
    const item = itemResult;

    let slotsOption: null | EquipableSlots = null;
    if (item.itemProperties.type === ItemPropertiesType.Equipment) {
      slotsOption = getEquipableSlots(item.itemProperties.equipmentProperties);
    }

    if (slotsOption === null) {
      gameState.comparedItem = null;
      return;
    }
    let slotToCompare = slotsOption.main;
    if (slotsOption.alternate !== null && compareAltSlot) slotToCompare = slotsOption.alternate;
    gameState.comparedSlot = slotToCompare;

    const equippedItemOption = focusedCharacter.combatantProperties.equipment[slotToCompare];
    if (!equippedItemOption || equippedItemOption.entityProperties.id === itemId)
      gameState.comparedItem = null;
    else gameState.comparedItem = equippedItemOption;
  });
}
