import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import {
  AdventuringParty,
  CombatAction,
  CombatAttribute,
  Combatant,
  ERROR_MESSAGES,
  Item,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { EquipmentSlot } from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";
import getActiveCombatant from "@/utils/getActiveCombatant";
import getParty from "@/utils/getParty";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import { FloatingText } from "./floating-text";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";
import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import { InventoryItemsMenuState } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { AssigningAttributePointsMenuState } from "@/app/game/ActionMenu/menu-state/assigning-attribute-points";

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
  // cameraData: { alpha: number; beta: number; radius: number; focus: Vector3 } = {
  //   alpha: 0,
  //   beta: 0,
  //   radius: 0,
  //   focus: Vector3.Zero(),
  // };
  game: null | SpeedDungeonGame = null;
  gameName: string | null = null;
  /** Unique name which characters may list as their controller */
  username: null | string = null;
  focusedCharacterId: string = "";
  detailedEntity: null | Combatant | Item = null;
  hoveredEntity: null | Combatant | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | EquipmentSlot = null;
  hoveredAction: null | CombatAction = null;
  actionMenuCurrentPageNumber: number = 0;
  actionMenuParentPageNumbers: number[] = [];
  combatLogMessages: CombatLogMessage[] = [];
  lastDebugMessageId: number = 0;
  babylonControlledCombatantDOMData: { [combatantId: string]: BabylonControlledCombatantData } = {};
  combatantFloatingText: { [combatantId: string]: FloatingText[] } = {};
  combatantModelsAwaitingSpawn: string[] = [];
  testText: string = "test";
  itemThumbnails: { [itemId: string]: string } = {};
  consideredItemUnmetRequirements: null | CombatAttribute[] = null;
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
    public getParty: () => Error | AdventuringParty,
    public getCurrentMenu: () => ActionMenuState,
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
export const assignAttributesMenuState = new AssigningAttributePointsMenuState();

export function getCurrentMenu(state: GameState) {
  const topStackedMenu = state.stackedMenuStates[state.stackedMenuStates.length - 1];
  if (topStackedMenu) return topStackedMenu;
  else return state.baseMenuState;
}
