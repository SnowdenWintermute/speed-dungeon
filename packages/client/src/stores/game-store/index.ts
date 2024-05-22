import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { SpeedDungeonGame } from "@speed-dungeon/common";
import { DetailableEntity } from "./detailable-entities";

export type GameState = {
  game: null | SpeedDungeonGame;
  focusedCharacterId: string;
  detailedEntity: null | DetailableEntity;
  hoveredEntity: null | DetailableEntity;
  mutateState: (fn: (state: GameState) => void) => void;
};

export type MutateGameStore = (fn: (state: GameState) => void) => void;

export const useGameStore = create<GameState>()(
  immer(
    devtools(
      (set, _get) => ({
        game: null,
        focusedCharacterId: "",
        detailedEntity: null,
        hoveredEntity: null,
        mutateState: (fn: (state: GameState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "game store" }
    )
  )
);
