export * from "./player.js";
export * from "./remove-player-from-party.js";
export * from "./get-player-party.js";
import { immerable } from "immer";
import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { EntityId, MaxAndCurrent } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "./player.js";
import assignCharacterActionTargets from "../combat/targeting/assign-character-action-targets.js";
import putPlayerInParty from "./put-player-in-party.js";
import removePlayerFromParty from "./remove-player-from-party.js";
import cycleCharacterTargets from "../combat/targeting/cycle-character-targets.js";
import getAllyIdsAndOpponentIdsOption from "./get-ally-ids-and-opponent-ids-option.js";
import removePlayerFromGame from "./remove-player-from-game.js";
import getCharacterInGame from "./get-character-in-game.js";
import getCombatantInGameById from "./get-combatant-in-game-by-id.js";
import getPartyOfCombatant from "./get-party-of-combatant.js";
import applyActionResults from "../combat/action-results/apply-action-results/index.js";
import { tickCombatUntilNextCombatantIsActive } from "../combat/turn-order/tick-combat-until-next-combatant-is-active.js";
import endActiveCombatantTurn from "../combat/turn-order/end-active-combatant-turn.js";
import allCombatantsInGroupAreDead from "../combat/all-combatants-in-group-are-dead.js";
import { getPlayerPartyOption } from "./get-player-party.js";
import cycleCharacterTargetingSchemes from "../combat/targeting/cycle-character-targeting-schemes.js";
import getActionResults from "../combat/action-results/get-action-results.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import handleBattleVictory from "./handle-battle-victory.js";
import { GameMode } from "../types.js";
import { MAX_PARTY_SIZE } from "../app-consts.js";

export class SpeedDungeonGame {
  [immerable] = true;
  players: { [username: string]: SpeedDungeonPlayer } = {};
  playerCapacity: number | null = null;
  playersReadied: string[] = [];
  adventuringParties: { [partyName: string]: AdventuringParty } = {};
  battles: { [id: EntityId]: Battle } = {};
  timeStarted: null | number = null;
  selectedStartingFloor: MaxAndCurrent = new MaxAndCurrent(1, 1);
  constructor(
    public id: string,
    public name: string,
    public mode: GameMode,
    public gameCreator: string | null = null,
    public isRanked: boolean = false
  ) {
    if (mode === GameMode.Progression) this.playerCapacity = MAX_PARTY_SIZE;
  }

  static removePlayerFromParty = removePlayerFromParty;
  static removePlayer = removePlayerFromGame;
  static putPlayerInParty = putPlayerInParty;
  static getCharacter = getCharacterInGame;
  static getCombatantById = getCombatantInGameById;
  static assignCharacterActionTargets = assignCharacterActionTargets;
  static cycleCharacterTargets = cycleCharacterTargets;
  static cycleCharacterTargetingSchemes = cycleCharacterTargetingSchemes;
  static getAllyIdsAndOpponentIdsOption = getAllyIdsAndOpponentIdsOption;
  static getPartyOfCombatant = getPartyOfCombatant;
  static getPlayerPartyOption = getPlayerPartyOption;
  static getActionResults = getActionResults;
  static applyActionResults = applyActionResults;
  static tickCombatUntilNextCombatantIsActive = tickCombatUntilNextCombatantIsActive;
  static endActiveCombatantTurn = endActiveCombatantTurn;
  static allCombatantsInGroupAreDead = allCombatantsInGroupAreDead;
  static handleBattleVictory = handleBattleVictory;
  static getBattleOption(game: SpeedDungeonGame, battleIdOption: null | string) {
    if (!battleIdOption) return undefined;
    return game.battles[battleIdOption];
  }
  static handlePlayerDeath(
    game: SpeedDungeonGame,
    battleIdOption: null | string,
    combatantId: string
  ) {
    if (battleIdOption === null) return;
    // - handle any death by removing the affected combatant's turn tracker
    const battleOption = game.battles[battleIdOption];
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    const battle = battleOption;
    Battle.removeCombatantTurnTrackers(battle, combatantId);
  }
}
