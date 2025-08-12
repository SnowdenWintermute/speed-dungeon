import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import {
  AdventuringParty,
  CombatActionName,
  CombatAttribute,
  Combatant,
  CombatantAssociatedData,
  ERROR_MESSAGES,
  EntityId,
  Item,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";
import { getActiveCombatant } from "@/utils/getActiveCombatant";
import getParty from "@/utils/getParty";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";
import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import { InventoryItemsMenuState } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { AssigningAttributePointsMenuState } from "@/app/game/ActionMenu/menu-state/assigning-attribute-points";
import { FloatingMessage } from "./floating-messages";
import { ItemsOnGroundMenuState } from "@/app/game/ActionMenu/menu-state/items-on-ground";
import { OperatingVendingMachineMenuState } from "@/app/game/ActionMenu/menu-state/operating-vending-machine";
import { PurchaseItemsMenuState } from "@/app/game/ActionMenu/menu-state/purchase-items";
import { CraftingItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/crafting-item-selection";
import { RepairItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/repair-item-selection";
import { ConvertToShardItemSelectionMenuState } from "@/app/game/ActionMenu/menu-state/convert-to-shard-item-selection";
import getCurrentParty from "@/utils/getCurrentParty";
import { TargetIndicator } from "@/app/3d-world/scene-entities/character-models/target-indicator-manager";
import { AbilityTreeMenuState } from "@/app/game/ActionMenu/menu-state/ability-tree-menu-state";

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export class GameState {
  [immerable] = true;
  baseMenuState: BaseMenuState;
  stackedMenuStates: ActionMenuState[] = [];
  game: null | SpeedDungeonGame = null;
  gameName: string | null = null;
  /** Unique name which characters may list as their controller */
  username: null | string = null;
  focusedCharacterId: string = "";
  detailedEntity: null | Combatant | Item = null;
  hoveredEntity: null | Combatant | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | TaggedEquipmentSlot = null;
  hoveredAction: null | CombatActionName = null;
  actionMenuCurrentPageNumber: number = 0;
  actionMenuParentPageNumbers: number[] = [];
  combatLogMessages: CombatLogMessage[] = [];
  lastDebugMessageId: number = 0;
  combatantModelLoadingStates: { [combantatId: EntityId]: boolean } = {};
  babylonControlledCombatantDOMData: { [combatantId: string]: BabylonControlledCombatantData } = {};
  combatantFloatingMessages: { [combatantId: string]: FloatingMessage[] } = {};
  testVar: boolean = false;
  itemThumbnails: { [itemId: string]: string } = {};
  combatantPortraits: { [combatantId: EntityId]: string } = {};
  consideredItemUnmetRequirements: null | CombatAttribute[] = null;
  showItemsOnGround: boolean = true;
  viewingLeaveGameModal: boolean = false;
  viewingDropShardsModal: boolean = false;
  combatantsWithPendingCraftActions: Partial<Record<EntityId, boolean>> = {};
  rerenderForcer: number = 0;
  targetingIndicators: TargetIndicator[] = [];

  getCurrentBattleId: () => null | string = () => {
    const party = this.getParty();
    if (party instanceof Error) return null;
    return party.battleId;
  };
  getPlayer: () => Error | SpeedDungeonPlayer = () => {
    const game = this.get().game;
    const username = this.get().username;
    if (!game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[username];
    if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    return playerOption;
  };
  hasGame: () => boolean = () => {
    return this.get().game ? true : false;
  };
  getFocusedCharacter: () => Error | Combatant = () => {
    return getFocusedCharacter();
  };
  getCharacter: (characterId: string) => Error | Combatant = (characterId: string) => {
    const partyResult = this.getParty();
    if (partyResult instanceof Error) return partyResult;
    const gameOption = this.get().game;
    if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    return SpeedDungeonGame.getCharacter(gameOption, partyResult.name, characterId);
  };

  constructor(
    public mutateState: MutateState<GameState>,
    public get: () => GameState,
    public getActiveCombatant: () => Error | null | Combatant,
    public getCombatant: (entityId: EntityId) => Error | Combatant,
    public getParty: () => Error | AdventuringParty,
    public getCurrentMenu: () => ActionMenuState
  ) {
    this.baseMenuState = new BaseMenuState(false);
  }
}

export const useGameStore = create<GameState>()(
  immer(
    devtools(
      (set, get) =>
        new GameState(
          (fn: (state: GameState) => void) => set(produce(fn)),
          get,
          () => getActiveCombatant(get()),
          (entityId: EntityId) => {
            const state = get();
            const gameOption = state.game;
            if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
            const game = gameOption;
            if (!state.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
            const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
            if (combatantResult instanceof Error) return combatantResult;
            return combatantResult;
          },
          () => getParty(get().game, get().username),
          () => getCurrentMenu(get())
        ),
      {
        enabled: true,
        name: "game store",
      }
    )
  )
);

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
export const abilityTreeMenuState = new AbilityTreeMenuState();

export function getCurrentMenu(state: GameState) {
  const topStackedMenu = state.stackedMenuStates[state.stackedMenuStates.length - 1];
  if (topStackedMenu) return topStackedMenu;
  else return state.baseMenuState;
}

export function getCombatantContext(
  gameState: GameState,
  combatantId: EntityId
): Error | CombatantAssociatedData {
  const gameOption = gameState.game;

  if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  const game = gameOption;
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  const partyOptionResult = getCurrentParty(gameState, gameState.username);
  if (partyOptionResult instanceof Error) return partyOptionResult;
  if (partyOptionResult === undefined) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
  const party = partyOptionResult;
  const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
  if (combatantResult instanceof Error) return combatantResult;
  return { game, party, combatant: combatantResult };
}
