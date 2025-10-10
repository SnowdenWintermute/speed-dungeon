import {
  ActionUserContext,
  CombatActionName,
  CombatAttribute,
  Combatant,
  EntityId,
  Item,
  SpeedDungeonGame,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import { InventoryItemsMenuState } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { AssigningAttributePointsMenuState } from "@/app/game/ActionMenu/menu-state/assigning-attribute-points";
import { ItemsOnGroundMenuState } from "@/app/game/ActionMenu/menu-state/items-on-ground";
import { OperatingVendingMachineMenuState } from "@/app/game/ActionMenu/menu-state/operating-vending-machine";
import { PurchaseItemsMenuState } from "@/app/game/ActionMenu/menu-state/purchase-items";
import { CraftingItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/crafting-item-selection";
import { RepairItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/repair-item-selection";
import { ConvertToShardItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/convert-to-shard-item-selection";
import { TargetIndicator } from "@/app/3d-world/scene-entities/character-models/target-indicator-manager";
import { AbilityTreeMenuState } from "@/app/game/ActionMenu/menu-state/ability-tree-menu-state";
import { AbilityTreeAbility } from "@speed-dungeon/common";
import { SelectBookToTradeForMenuState } from "@/app/game/ActionMenu/menu-state/select-book-type";
import { Point } from "@speed-dungeon/common";
import { FloatingMessage } from "@/stores/game-store/floating-messages";
import { BabylonControlledCombatantData } from "@/stores/game-store/babylon-controlled-combatant-data";

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export enum UiDisplayMode {
  Detailed,
  Simple,
  Sparse,
}

export const UI_DISPLAY_MODE_STRINGS: Record<UiDisplayMode, string> = {
  [UiDisplayMode.Detailed]: "Detailed",
  [UiDisplayMode.Simple]: "Simple",
  [UiDisplayMode.Sparse]: "Sparse",
};

export class AppStoreManager {
  game: null | SpeedDungeonGame = null;

  // Connectivity
  websocketConnected: boolean = true;

  // Action Menu State
  baseMenuState: BaseMenuState;
  stackedMenuStates: ActionMenuState[] = [];

  // Misc Game UI
  focusedCharacterId: string = "";
  username: null | string = null;
  showItemsOnGround: boolean = true;
  targetingIndicators: TargetIndicator[] = [];
  combatantsWithPendingCraftActions: Partial<Record<EntityId, boolean>> = {};
  threatTableDetailedDisplayMode: UiDisplayMode = UiDisplayMode.Simple;

  // Toggles
  modKeyHeld: boolean = false;
  alternateClickKeyHeld: boolean = false;
  hotkeysDisabled: boolean = false;

  // Tooltips
  tooltipPosition: null | Point = null;
  tooltipText: null | string = null;

  authFormEmailField: string = "";

  // Detailables UI
  detailedEntity: null | Combatant | Item = null;
  hoveredEntity: null | Combatant | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | TaggedEquipmentSlot = null;
  consideredItemUnmetRequirements: null | CombatAttribute[] = null;
  hoveredAction: null | CombatActionName = null;
  hoveredCombatantAbility: null | AbilityTreeAbility = null;
  detailedCombatantAbility: null | AbilityTreeAbility = null;

  // Combat log
  combatLogMessages: CombatLogMessage[] = [];

  // Babylon integration
  lastDebugMessageId: number = 0;
  combatantModelLoadingStates: { [combantatId: EntityId]: boolean } = {};
  babylonControlledCombatantDOMData: { [combatantId: string]: BabylonControlledCombatantData } = {};
  combatantFloatingMessages: { [combatantId: string]: FloatingMessage[] } = {};

  // Images
  itemThumbnails: { [itemId: string]: string } = {};
  combatantPortraits: { [combatantId: EntityId]: string } = {};

  hasGame: () => boolean = () => {
    throw new Error("not implementeted");
  };

  getFocusedCharacter: () => Error | Combatant = () => {
    throw new Error("not implementeted");
    // return getFocusedCharacter();
  };

  constructor() {
    this.baseMenuState = new BaseMenuState(false);
  }
}

// instantiate all states upfront and save them, or just save them as they are created
// so we don't pay object creation cost every time we switch state
//
// if we don't declare them in this file we get an error for trying to use the stores
// before they're initialized

export const baseMenuState = new BaseMenuState(false);
export const inventoryItemsMenuState = new InventoryItemsMenuState();
export const itemsOnGroundMenuState = new ItemsOnGroundMenuState();
export const assignAttributesMenuState = new AssigningAttributePointsMenuState();
export const operateVendingMachineMenuState = new OperatingVendingMachineMenuState();
export const purchasingItemsMenuState = new PurchaseItemsMenuState();
export const craftingItemSelectionMenuState = new CraftingItemSelectionMenuState();
export const repairItemSelectionMenuState = new RepairItemSelectionMenuState();
export const convertToShardItemSelectionMenuState = new ConvertToShardItemSelectionMenuState();
export const selectBooksToTradeForMenuState = new SelectBookToTradeForMenuState();
export const abilityTreeMenuState = new AbilityTreeMenuState();

export function getCurrentMenu() {
  throw new Error("not implemented");
  // const topStackedMenu = state.stackedMenuStates[state.stackedMenuStates.length - 1];
  // if (topStackedMenu) return topStackedMenu;
  // else return state.baseMenuState;
}

export function getActionUserContext(): Error | ActionUserContext {
  throw new Error("not implemented");
  // const gameOption = gameState.game;

  // if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  // const game = gameOption;
  // if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  // const partyOptionResult = getCurrentParty(gameState, gameState.username);
  // if (partyOptionResult instanceof Error) return partyOptionResult;
  // if (partyOptionResult === undefined) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
  // const party = partyOptionResult;
  // const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
  // if (combatantResult instanceof Error) return combatantResult;
  // return new ActionUserContext(game, party, combatantResult);
}
