import { useGameStore } from "@/stores/game-store";
import {
  CombatantEquipment,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  Equipment,
  getItemInAdventuringParty,
} from "@speed-dungeon/common";
import { getPlayerPartyOption } from "@speed-dungeon/common";
import getFocusedCharacter from "./getFocusedCharacter";
import { EquipableSlots } from "@speed-dungeon/common";

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
    if (item instanceof Equipment)
      slotsOption =
        EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[
          item.equipmentBaseItemProperties.taggedBaseItem.equipmentType
        ];

    if (slotsOption === null) {
      gameState.comparedItem = null;
      return;
    }
    let slotToCompare = slotsOption.main;
    if (slotsOption.alternate !== null && compareAltSlot) slotToCompare = slotsOption.alternate;
    gameState.comparedSlot = slotToCompare;

    const equippedItemOption = CombatantEquipment.getEquipmentInSlot(
      focusedCharacter.combatantProperties,
      slotToCompare
    );

    if (!equippedItemOption || equippedItemOption.entityProperties.id === itemId)
      gameState.comparedItem = null;
    else gameState.comparedItem = equippedItemOption;
  });
}
