import {
  AbilityTreeAbility,
  AdventuringParty,
  CombatAttribute,
  Combatant,
  Equipment,
  EntityName,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

// who the character sheet is about and what a viewer may do to them. the in-game sheet and the
// public ladder pages render the same components against different implementations of this, so
// neither host reads the other's state and the two renderings cannot drift apart.
// a handler getter returning null is how "this viewer cannot do that" travels — the components
// decide whether that means hiding a control or disabling it.
// hovering and detailing are not here: both hosts do the same thing with them, and the application's
// DetailableEntityFocus needs no game to work
export abstract class CharacterSheetSubject {
  constructor(readonly combatant: Combatant) {}

  // the world the subject is in, if any. a snapshot is in none of one, so both of these are null on
  // a ladder page and the displays that take them already accept their absence
  abstract getGameOption(): null | SpeedDungeonGame;
  abstract getPartyOption(): null | AdventuringParty;

  abstract getEquipmentIsDraggable(): boolean;
  abstract getEquipmentSlotClickHandlerOption(): null | ((item: Equipment) => void);
  // whether to dim what cannot be acted on. that reads as "this one is not yours" next to a
  // character that is, and as nothing but noise on a page where no character is anyone's
  abstract getIsUnownedInPlay(): boolean;
  // never null on a public page: switching which weapon set is being looked at is a property of the
  // viewer, not of the character, and in a game it is also a turn the character has to spend
  abstract getHotswapSlotSelectionHandlerOption(): null | ((slotIndex: number) => void);
  abstract getAttributeAllocationHandlerOption(): null | ((attribute: CombatAttribute) => void);
  abstract getAbilityAllocationHandlerOption(): null | ((ability: AbilityTreeAbility) => void);
  // selecting an ability always details it, which the sheet does itself. this is the extra the
  // in-game sheet does on top: opening the ability's own action menu screen
  abstract handleAbilitySelected(ability: AbilityTreeAbility): void;
  abstract getPetRenameHandlerOption(): null | ((newName: EntityName) => void);
}
