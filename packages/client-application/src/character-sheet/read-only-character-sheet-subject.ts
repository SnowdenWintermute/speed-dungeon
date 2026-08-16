import { Combatant, Equipment } from "@speed-dungeon/common";
import { CharacterSheetSubject } from "./character-sheet-subject";
import { DetailableEntityFocus } from "../detailables/detailable-entity-focus";

// a character nobody viewing can act on: a ladder page's build, or an opponent being inspected
// mid-game. what still works is what only changes what is being looked at — selecting a hotswap
// slot, and pinning an item's details. the slot is applied straight to the combatant in hand, which
// on a ladder page is a deserialized copy owned by the page
export class ReadOnlyCharacterSheetSubject extends CharacterSheetSubject {
  constructor(
    combatant: Combatant,
    private readonly detailableEntityFocus: DetailableEntityFocus
  ) {
    super(combatant);
  }
  getGameOption() {
    return null;
  }

  getPartyOption() {
    return null;
  }

  getEquipmentIsDraggable() {
    return false;
  }

  getIsUnownedInPlay() {
    return false;
  }

  // pins the item's details, which is what a click does in game too. it stops there: there is no
  // action menu here to open onto it
  getEquipmentSlotClickHandlerOption() {
    return (item: Equipment) => {
      this.detailableEntityFocus.selectItem(item);
    };
  }

  getHotswapSlotSelectionHandlerOption() {
    return (slotIndex: number) => {
      this.combatant.combatantProperties.equipment.hotswapSlotsManager.changeSelectedHotswapSlot(
        slotIndex
      );
    };
  }

  getAttributeAllocationHandlerOption() {
    return null;
  }

  getAbilityAllocationHandlerOption() {
    return null;
  }

  handleAbilitySelected() {
    // an ability is detailed by the sheet itself; there is no action menu here to open
  }

  getPetRenameHandlerOption() {
    return null;
  }
}
