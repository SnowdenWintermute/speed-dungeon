import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { immerable, produce } from "immer";
import {
  ActionUserContext,
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  EntityId,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { MutateState } from "../mutate-state";
import { getActiveCombatant } from "@/utils/getActiveCombatant";
import getParty from "@/utils/getParty";
import { getFocusedCharacter } from "@/utils/getFocusedCharacter";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import getCurrentParty from "@/utils/getCurrentParty";
import { TargetIndicator } from "@/app/3d-world/scene-entities/character-models/target-indicator-manager";

export class GameState {
  [immerable] = true;
  gameName: string | null = null;
  game: null | SpeedDungeonGame = null;

  /** Unique name which characters may list as their controller */
  username: null | string = null;
  focusedCharacterId: string = "";
  combatantsWithPendingCraftActions: Partial<Record<EntityId, boolean>> = {};
  targetingIndicators: TargetIndicator[] = [];

  combatLogMessages: CombatLogMessage[] = [];

  itemThumbnails: { [itemId: string]: string } = {};
  combatantPortraits: { [combatantId: EntityId]: string } = {};

  rerenderForcer: number = 0;

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
    return SpeedDungeonGame.getCombatantById(gameOption, characterId);
  };

  constructor(
    public mutateState: MutateState<GameState>,
    public get: () => GameState,
    public getActiveCombatant: () => Error | null | Combatant,
    public getCombatant: (entityId: EntityId) => Error | Combatant,
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
          () => getParty(get().game, get().username)
        ),
      {
        enabled: true,
        name: "game store",
      }
    )
  )
);

export function getActionUserContext(
  gameState: GameState,
  combatantId: EntityId
): Error | ActionUserContext {
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
  return new ActionUserContext(game, party, combatantResult);
}
