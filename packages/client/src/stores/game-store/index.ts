import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import {
  ActionCommand,
  AdventuringParty,
  BattleReport,
  CombatAction,
  CombatAttribute,
  Combatant,
  ERROR_MESSAGES,
  Item,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { DetailableEntity } from "./detailable-entities";
import { EquipmentSlot } from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";
import getActiveCombatant from "@/utils/getActiveCombatant";
import getParty from "@/utils/getParty";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import { FloatingText } from "./floating-text";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";
import { useUIStore } from "../ui-store";
import { useAlertStore } from "../alert-store";
import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import { BaseOutOfCombatMenuState } from "@/app/game/ActionMenu/menu-state/base-out-of-combat";
import { InventoryItemsMenuState } from "@/app/game/ActionMenu/menu-state/inventory-items";
import { InCombatMenuState } from "@/app/game/ActionMenu/menu-state/base-in-combat";
import { ConsideringItemMenuState } from "@/app/game/ActionMenu/menu-state/considering-item";

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export class GameState {
  [immerable] = true;
  menuState: ActionMenuState;
  baseMenuState: ActionMenuState;
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
  detailedEntity: null | DetailableEntity = null;
  hoveredEntity: null | DetailableEntity = null;
  comparedItem: null | Item = null;
  comparedSlot: null | EquipmentSlot = null;
  hoveredAction: null | CombatAction = null;
  actionMenuCurrentPageNumber: number = 0;
  actionMenuParentPageNumbers: number[] = [];
  consideredItemUnmetRequirements: null | CombatAttribute[] = null;
  menuContext: MenuContext | null = null;
  battleReportPendingProcessing: null | BattleReport = null;
  combatLogMessages: CombatLogMessage[] = [];
  lastDebugMessageId: number = 0;
  babylonControlledCombatantDOMData: { [combatantId: string]: BabylonControlledCombatantData } = {};
  combatantFloatingText: { [combatantId: string]: FloatingText[] } = {};
  combatantModelsAwaitingSpawn: string[] = [];
  actionCommandWaitingArea: ActionCommand[] = [];
  testText: string = "test";
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
    return getFocusedCharacter(this.get());
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
    public getCurrentMenu: () => ActionMenuState
  ) {
    this.baseMenuState = new BaseOutOfCombatMenuState(
      this,
      useUIStore.getState(),
      useAlertStore.getState()
    );
    this.menuState = this.baseMenuState;
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

export const baseMenuState = new BaseOutOfCombatMenuState(
  useGameStore.getState(),
  useUIStore.getState(),
  useAlertStore.getState()
);
export const inventoryItemsMenuState = new InventoryItemsMenuState(
  useGameStore.getState(),
  useUIStore.getState(),
  useAlertStore.getState()
);
export const inCombatMenuState = new InCombatMenuState(
  useGameStore.getState(),
  useUIStore.getState(),
  useAlertStore.getState()
);

export function getCurrentMenu(state: GameState) {
  const topStackedMenu = state.stackedMenuStates[state.stackedMenuStates.length - 1];
  if (topStackedMenu) return topStackedMenu;
  else return state.menuState;
}
