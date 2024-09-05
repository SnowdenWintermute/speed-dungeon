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
  CombatantDetails,
  ERROR_MESSAGES,
  Item,
  PlayerCharacter,
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

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export class GameState {
  [immerable] = true;
  // cameraData: { alpha: number; beta: number; radius: number; focus: Vector3 } = {
  //   alpha: 0,
  //   beta: 0,
  //   radius: 0,
  //   focus: Vector3.Zero(),
  // };
  game: null | SpeedDungeonGame = null;
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
  getFocusedCharacter: () => Error | PlayerCharacter = () => {
    return getFocusedCharacter(this.get());
  };
  getCharacter: (characterId: string) => Error | PlayerCharacter = (characterId: string) => {
    const partyResult = this.getParty();
    if (partyResult instanceof Error) return partyResult;
    const gameOption = this.get().game;
    if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    return SpeedDungeonGame.getCharacter(gameOption, partyResult.name, characterId);
  };

  constructor(
    public mutateState: MutateState<GameState>,
    public get: () => GameState,
    public getActiveCombatant: () => Error | null | CombatantDetails,
    public getParty: () => Error | AdventuringParty
  ) {}
}

export const useGameStore = create<GameState>()(
  immer(
    devtools(
      (set, get) =>
        new GameState(
          (fn: (state: GameState) => void) => set(produce(fn)),
          get,
          () => getActiveCombatant(get()),
          () => getParty(get().game, get().username)
        ),
      {
        enabled: true,
        name: "game store",
      }
    )
  )
);
