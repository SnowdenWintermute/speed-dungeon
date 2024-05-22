import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import { Item, SpeedDungeonGame } from "@speed-dungeon/common";
import { DetailableEntity } from "./detailable-entities";
import { EquipmentSlot } from "@speed-dungeon/common";

export class GameState {
  [immerable] = true;
  game: null | SpeedDungeonGame = null;
  focusedCharacterId: string = "";
  detailedEntity: null | DetailableEntity = null;
  hoveredEntity: null | DetailableEntity = null;
  selectedItem: null | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | EquipmentSlot = null;
  constructor(public mutateState: (fn: (state: GameState) => void) => void) {}
}

export type MutateGameStore = (fn: (state: GameState) => void) => void;

export const useGameStore = create<GameState>()(
  immer(
    devtools((set, _get) => new GameState((fn: (state: GameState) => void) => set(produce(fn))), {
      enabled: true,
      name: "game store",
    })
  )
);
