import { GameState, MenuContext } from "@/stores/game-store";
import {
  AdventuringParty,
  CombatActionProperties,
  CombatantAbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { DungeonRoomType } from "@speed-dungeon/common/src/adventuring_party/dungeon-room";
import { AbilityUsableContext } from "@speed-dungeon/common";
import { ConsumableType } from "@speed-dungeon/common";
import { ItemPropertiesType } from "@speed-dungeon/common";

export enum MenuType {
  OutOfCombat,
  InCombat,
  CombatActionSelected,
  LevelUpAbilities,
  AssignAttributePoints,
  InventoryOpen,
  ViewingEquipedItems,
  ItemSelected,
  ItemsOnGround,
  UnopenedChest,
  Staircase,
}

export interface ActionMenuRelevantInformation {
  menuTypes: MenuType[];
  equipmentIds: string[];
  consumableIdsByType: Partial<Record<ConsumableType, string[]>>;
  abilities: CombatantAbilityName[];
  selectedCombatActionPropertiesOption: null | CombatActionProperties;
  inventoryIsOpen: boolean;
  selectedItemIdOption: null | string;
}

export default function collectActionMenuRelevantInformation(
  gameState: GameState,
  party: AdventuringParty
): Error | ActionMenuRelevantInformation {
  const menuTypes: MenuType[] = [];
  const equipmentIds: string[] = [];
  const consumableIdsByType: Partial<Record<ConsumableType, string[]>> = {};
  let abilityNames: CombatantAbilityName[] = [];
  const focusedCharacterOption = party.characters[gameState.focusedCharacterId];
  if (!focusedCharacterOption) return new Error(ERROR_MESSAGES.PARTY.CHARACTER_NOT_FOUND);
  const { combatantProperties } = focusedCharacterOption;

  let focusedCharacterSelectedCombatActionPropertiesOption;
  const selectedActionOption = combatantProperties.selectedCombatAction;
  if (selectedActionOption !== null)
    focusedCharacterSelectedCombatActionPropertiesOption =
      CombatantProperties.getCombatActionPropertiesIfOwned(
        combatantProperties,
        selectedActionOption
      );

  if (focusedCharacterSelectedCombatActionPropertiesOption)
    menuTypes.push(MenuType.CombatActionSelected);
  else if (gameState.menuContext === MenuContext.ItemsOnGround)
    menuTypes.push(MenuType.ItemsOnGround);
  else if (gameState.selectedItem) menuTypes.push(MenuType.ItemSelected);
  else if (gameState.menuContext === MenuContext.Equipment) {
    menuTypes.push(MenuType.ViewingEquipedItems);
    for (const item of Object.values(combatantProperties.equipment)) {
      equipmentIds.push(item.entityProperties.id);
    }
  } else if (gameState.menuContext === MenuContext.InventoryItems) {
    menuTypes.push(MenuType.InventoryOpen);
    for (const item of Object.values(combatantProperties.inventory.items)) {
      switch (item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          equipmentIds.push(item.entityProperties.id);
          break;
        case ItemPropertiesType.Consumable:
          const { consumableType } = item.itemProperties.consumableProperties;
          if (!consumableIdsByType[consumableType])
            consumableIdsByType[consumableType] = [item.entityProperties.id];
          else consumableIdsByType[consumableType]!.push(item.entityProperties.id);
      }
    }
  } else if (gameState.menuContext === MenuContext.AttributeAssignment)
    menuTypes.push(MenuType.AssignAttributePoints);
  else if (party.battleId === null) {
    menuTypes.push(MenuType.OutOfCombat);
    abilityNames = CombatantProperties.getAbilityNamesFilteredByUseableContext(
      combatantProperties,
      AbilityUsableContext.InCombat
    );

    if (party.currentRoom.items.length > 0) menuTypes.push(MenuType.ItemsOnGround);
    if (party.currentRoom.roomType === DungeonRoomType.Staircase)
      menuTypes.push(MenuType.Staircase);
  } else {
    menuTypes.push(MenuType.InCombat);
    abilityNames = CombatantProperties.getAbilityNamesFilteredByUseableContext(
      combatantProperties,
      AbilityUsableContext.OutOfCombat
    );
  }

  abilityNames.sort((a, b) => a - b);

  let selectedCombatActionPropertiesOption: null | CombatActionProperties = null;
  if (combatantProperties.selectedCombatAction) {
    const propertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      combatantProperties,
      combatantProperties.selectedCombatAction
    );
    if (propertiesResult instanceof Error) return propertiesResult;
    else selectedCombatActionPropertiesOption = propertiesResult;
  }

  const inventoryIsOpen =
    gameState.menuContext === MenuContext.Equipment ||
    gameState.menuContext === MenuContext.InventoryItems ||
    gameState.menuContext === MenuContext.AttributeAssignment;

  return {
    menuTypes,
    equipmentIds,
    consumableIdsByType,
    abilities: abilityNames,
    selectedCombatActionPropertiesOption,
    inventoryIsOpen,
    selectedItemIdOption: gameState.selectedItem?.entityProperties.id ?? null,
  };
}
