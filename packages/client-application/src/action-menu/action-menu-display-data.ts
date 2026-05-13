import type {
  AbilityTreeAbility,
  BookConsumableType,
  CombatActionName,
  CombatAttribute,
  CraftingAction,
  EntityName,
  Equipment,
  Item,
  Consumable,
  Combatant,
} from "@speed-dungeon/common";
import type { KeyCode } from "../ui/keybind-config";
import type { ActionMenuScreen } from "./screens";
import type { ActionMenuScreenType } from "./screen-types";
import { ConsideringCombatantAbilityActionMenuScreen } from "./screens/ability-tree-ability";

// ===== TOP SECTION =====

export enum ActionMenuTopSectionItemType {
  GoBack,
  ToggleInventory,
  ViewAbilityTree,
  ViewItemsOnGround,
  ToggleAttributeAllocationMenuHidden,
  ToggleViewEquipment,
  OpenInventoryAsFreshStack,
  ExecuteCombatAction,
  CycleTargetingSchemes,
  ConfirmShardConversion,
  UseItem,
  EquipToAltSlot,
  DropItem,
  AllocateAbilityPoint,
  VendingMachineShards,
  TakeAllItemsFromGround,
  ConfirmTradeForBook,
}

export interface ActionMenuTopSectionItemMap {
  [ActionMenuTopSectionItemType.GoBack]: { extraHotkeys?: KeyCode[]; extraFn?: () => void };
  [ActionMenuTopSectionItemType.ToggleInventory]: undefined;
  [ActionMenuTopSectionItemType.ViewAbilityTree]: undefined;
  [ActionMenuTopSectionItemType.ViewItemsOnGround]: undefined;
  [ActionMenuTopSectionItemType.ToggleAttributeAllocationMenuHidden]: undefined;
  [ActionMenuTopSectionItemType.ToggleViewEquipment]: undefined;
  [ActionMenuTopSectionItemType.OpenInventoryAsFreshStack]: undefined;
  [ActionMenuTopSectionItemType.ExecuteCombatAction]: undefined;
  [ActionMenuTopSectionItemType.CycleTargetingSchemes]: undefined;
  [ActionMenuTopSectionItemType.ConfirmShardConversion]: {
    item: Item;
    screenType: ActionMenuScreenType.ItemSelected | ActionMenuScreenType.ConfimConvertToShards;
  };
  [ActionMenuTopSectionItemType.UseItem]: { item: Item };
  [ActionMenuTopSectionItemType.EquipToAltSlot]: { item: Item };
  [ActionMenuTopSectionItemType.DropItem]: { item: Item };
  [ActionMenuTopSectionItemType.AllocateAbilityPoint]: { ability: AbilityTreeAbility };
  [ActionMenuTopSectionItemType.VendingMachineShards]: undefined;
  [ActionMenuTopSectionItemType.TakeAllItemsFromGround]: {
    hotkeys: KeyCode[];
    hotkeyString: string;
    disabled: boolean;
    onClick: () => void;
  };
  [ActionMenuTopSectionItemType.ConfirmTradeForBook]: {
    hotkeys: KeyCode[];
    hotkeyString: string;
    disabled: boolean;
    onClick: () => void;
  };
}

export type ActionMenuTopSectionItem = {
  [K in keyof ActionMenuTopSectionItemMap]: {
    type: K;
    data: ActionMenuTopSectionItemMap[K];
  };
}[keyof ActionMenuTopSectionItemMap];

// ===== NUMBERED BUTTONS =====

export enum ActionMenuNumberedButtonType {
  CombatAction,
  Item,
  CraftAction,
  AbilityTreeAbility,
  AbilityTreeColumn,
  PurchaseConsumable,
  RepairEquipment,
  VendingMachineOption,
  AssignAttributePoint,
}

export interface ActionMenuNumberedButtonMap {
  [ActionMenuNumberedButtonType.CombatAction]: {
    actionName: CombatActionName;
    user: Combatant;
    hotkeys: KeyCode[];
    hotkeyLabel: string;
  };
  [ActionMenuNumberedButtonType.Item]: {
    item: Item;
    text: EntityName;
    disabled: boolean;
    hotkeys: KeyCode[];
    hotkeyLabel: string;
    onClick: (item: Item) => void;
    showEquippedStatus?: boolean;
    price?: number | null;
  };
  [ActionMenuNumberedButtonType.CraftAction]: {
    equipment: Equipment;
    craftingAction: CraftingAction;
    listIndex: number;
  };
  [ActionMenuNumberedButtonType.AbilityTreeAbility]: {
    abilityOption: AbilityTreeAbility | undefined;
    rowIndex: number;
    abilityTreeColumn: (AbilityTreeAbility | undefined)[];
  };
  [ActionMenuNumberedButtonType.AbilityTreeColumn]: {
    columnNumber: number;
    onClick: () => void;
  };
  [ActionMenuNumberedButtonType.PurchaseConsumable]: {
    item: Consumable;
    listIndex: number;
  };
  [ActionMenuNumberedButtonType.RepairEquipment]: {
    equipment: Equipment;
    listIndex: number;
  };
  [ActionMenuNumberedButtonType.VendingMachineOption]: {
    title: string;
    disabled: boolean;
    onClick: () => void;
  };
  [ActionMenuNumberedButtonType.AssignAttributePoint]: {
    attribute: CombatAttribute;
    label: string;
    disabled: boolean;
    onClick: () => void;
  };
}

export type ActionMenuNumberedButtonDescriptor = {
  [K in keyof ActionMenuNumberedButtonMap]: {
    type: K;
    data: ActionMenuNumberedButtonMap[K];
  };
}[keyof ActionMenuNumberedButtonMap];

// ===== CENTRAL SECTION =====

export enum ActionMenuCentralSectionType {
  ConsideringItem,
  ConfirmShardConversion,
  CombatActionDetail,
  AbilityDetail,
  TradeForBookConfirmation,
  TradeForBookRequirements,
}

export interface ActionMenuCentralSectionMap {
  [ActionMenuCentralSectionType.ConsideringItem]: undefined;
  [ActionMenuCentralSectionType.ConfirmShardConversion]: undefined;
  [ActionMenuCentralSectionType.CombatActionDetail]: { actionName: CombatActionName };
  [ActionMenuCentralSectionType.AbilityDetail]: {
    ability: AbilityTreeAbility;
    column: AbilityTreeAbility[];
  };
  [ActionMenuCentralSectionType.TradeForBookConfirmation]: {
    item: Item;
    bookType: BookConsumableType;
    onClick: () => void;
  };
  [ActionMenuCentralSectionType.TradeForBookRequirements]: {
    bookType: BookConsumableType;
  };
}

export type ActionMenuCentralSection = {
  [K in keyof ActionMenuCentralSectionMap]: {
    type: K;
    data: ActionMenuCentralSectionMap[K];
  };
}[keyof ActionMenuCentralSectionMap];

// ===== BOTTOM SECTION =====

export enum ActionMenuBottomSectionType {
  PageTurning,
  CycleCombatActionTargets,
  CycleConsideredAbilityInTreeColumn,
}

export interface ActionMenuBottomSectionMap {
  [ActionMenuBottomSectionType.PageTurning]: { screen: ActionMenuScreen };
  [ActionMenuBottomSectionType.CycleCombatActionTargets]: undefined;
  [ActionMenuBottomSectionType.CycleConsideredAbilityInTreeColumn]: {
    screen: ConsideringCombatantAbilityActionMenuScreen;
  };
}

export type ActionMenuBottomSection = {
  [K in keyof ActionMenuBottomSectionMap]: {
    type: K;
    data: ActionMenuBottomSectionMap[K];
  };
}[keyof ActionMenuBottomSectionMap];

// ===== SIDE PANEL SECTION =====

export enum ActionMenuSidePanelSectionType {
  CraftingItem,
}

export interface ActionMenuSidePanelSectionMap {
  [ActionMenuSidePanelSectionType.CraftingItem]: { equipment: Equipment };
}

export type ActionMenuSidePanelSection = {
  [K in keyof ActionMenuSidePanelSectionMap]: {
    type: K;
    data: ActionMenuSidePanelSectionMap[K];
  };
}[keyof ActionMenuSidePanelSectionMap];
