import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { SpeedDungeonGame } from "@speed-dungeon/common";

export type GameState = {
  game: null | SpeedDungeonGame;
  mutateState: (fn: (state: GameState) => void) => void;
};

export type MutateGameStore = (fn: (state: GameState) => void) => void;

export const useGameStore = create<GameState>()(
  immer(
    devtools(
      (set, _get) => ({
        game: null,
        mutateState: (fn: (state: GameState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "game store" }
    )
  )
);
