import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import { CombatAction, Item, SpeedDungeonGame } from "@speed-dungeon/common";
import { DetailableEntity } from "./detailable-entities";
import { EquipmentSlot } from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";
import { CombatAttribute } from "@speed-dungeon/common/src/combatants/combat-attributes";

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export class GameState {
  [immerable] = true;
  game: null | SpeedDungeonGame = null;
  username: null | string = null;
  focusedCharacterId: string = "";
  detailedEntity: null | DetailableEntity = null;
  hoveredEntity: null | DetailableEntity = null;
  selectedItem: null | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | EquipmentSlot = null;
  hoveredAction: null | CombatAction = null;
  actionMenuCurrentPageNumber: number = 0;
  actionMenuParentPageNumbers: number[] = [];
  consideredItemUnmetRequirements: null | CombatAttribute[] = null;
  menuContext: MenuContext | null = null;

  constructor(
    public mutateState: MutateState<GameState>,
    public get: () => GameState
  ) {}
}

export const useGameStore = create<GameState>()(
  immer(
    devtools(
      (set, get) => new GameState((fn: (state: GameState) => void) => set(produce(fn)), get),
      {
        enabled: true,
        name: "game store",
      }
    )
  )
);
