import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import { Item, SpeedDungeonGame } from "@speed-dungeon/common";
import { DetailableEntity } from "./detailable-entities";
import { EquipmentSlot } from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";

export class GameState {
  [immerable] = true;
  game: null | SpeedDungeonGame = null;
  focusedCharacterId: string = "";
  detailedEntity: null | DetailableEntity = null;
  hoveredEntity: null | DetailableEntity = null;
  selectedItem: null | Item = null;
  comparedItem: null | Item = null;
  comparedSlot: null | EquipmentSlot = null;

  constructor(
    public mutateState: MutateState<GameState>,
    public get: () => GameState
  ) {}

  getCurrentParty(username: string) {
    const state = this.get();
    const player = state.game?.players[username];
    if (!player?.partyName) return undefined;
    return state.game?.adventuringParties[player.partyName];
  }
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
