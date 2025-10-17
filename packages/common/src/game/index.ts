export * from "./player.js";
export * from "./remove-player-from-party.js";
export * from "./get-player-party.js";
import { immerable } from "immer";
import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { EntityId } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "./player.js";
import putPlayerInParty from "./put-player-in-party.js";
import removePlayerFromParty from "./remove-player-from-party.js";
import { removePlayerFromGame } from "./remove-player-from-game.js";
import { getCombatantInGameById } from "./get-combatant-in-game-by-id.js";
import { getPartyOfCombatant } from "./get-party-of-combatant.js";
import { allCombatantsInGroupAreDead } from "../combat/all-combatants-in-group-are-dead.js";
import { getPlayerPartyOption } from "./get-player-party.js";
import { handleBattleVictory } from "./handle-battle-victory.js";
import { GameMode } from "../types.js";
import { MAX_PARTY_SIZE } from "../app-consts.js";
import { makeAutoObservable } from "mobx";
import { plainToInstance } from "class-transformer";

export class SpeedDungeonGame {
  players: { [username: string]: SpeedDungeonPlayer } = {};
  playerCapacity: number | null = null;
  playersReadied: string[] = [];
  adventuringParties: { [partyName: string]: AdventuringParty } = {};
  battles: { [id: EntityId]: Battle } = {};
  timeStarted: null | number = null;
  lowestStartingFloorOptionsBySavedCharacter: { [entityId: string]: number } = {};
  selectedStartingFloor: number = 1;
  constructor(
    public id: string,
    public name: string,
    public mode: GameMode,
    public gameCreator: string | null = null,
    public isRanked: boolean = false
  ) {
    if (mode === GameMode.Progression) this.playerCapacity = MAX_PARTY_SIZE;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getParties() {
    return this.adventuringParties;
  }

  static getDeserialized(game: SpeedDungeonGame) {
    for (const [partyId, party] of Object.entries(game.adventuringParties)) {
      game.adventuringParties[partyId] = AdventuringParty.getDeserialized(party);
    }

    for (const [username, player] of Object.entries(game.players))
      SpeedDungeonPlayer.deserialize(player);
    return plainToInstance(SpeedDungeonGame, game);
  }

  static removePlayerFromParty = removePlayerFromParty;
  static removePlayer = removePlayerFromGame;
  static putPlayerInParty = putPlayerInParty;
  static getCombatantById = getCombatantInGameById;
  static getPartyOfCombatant = getPartyOfCombatant;
  static getPlayerPartyOption = getPlayerPartyOption;
  static allCombatantsInGroupAreDead = allCombatantsInGroupAreDead;
  static handleBattleVictory = handleBattleVictory;
  static getBattleOption(game: SpeedDungeonGame, battleIdOption: null | string) {
    if (!battleIdOption) return undefined;
    return game.battles[battleIdOption];
  }
}
