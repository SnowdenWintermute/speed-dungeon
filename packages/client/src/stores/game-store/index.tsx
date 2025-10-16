import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import { ERROR_MESSAGES, SpeedDungeonGame, SpeedDungeonPlayer } from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";

export class GameState {
  [immerable] = true;
  gameName: string | null = null;
  game: null | SpeedDungeonGame = null;

  /** Unique name which characters may list as their controller */
  username: null | string = null;

  rerenderForcer: number = 0;

  getPlayer: () => Error | SpeedDungeonPlayer = () => {
    const game = this.get().game;
    const username = this.get().username;
    if (!game) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[username];
    if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    return playerOption;
  };

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
