export * from "./player.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { EntityId } from "../primatives/index.js";
import { SpeedDungeonPlayer } from "./player.js";
import { GameMode } from "../types.js";
import { MAX_PARTY_SIZE } from "../app-consts.js";
import { makeAutoObservable } from "mobx";
import { plainToInstance } from "class-transformer";
import { ArrayUtils } from "../utils/array-utils.js";
import { runIfInBrowser } from "../utils/index.js";
import { Combatant } from "../combatants/index.js";
import cloneDeep from "lodash.clonedeep";
import { ERROR_MESSAGES } from "../errors/index.js";

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
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(game: SpeedDungeonGame) {
    for (const [partyId, party] of Object.entries(game.adventuringParties)) {
      game.adventuringParties[partyId] = AdventuringParty.getDeserialized(party);
    }

    for (const player of Object.values(game.players)) {
      SpeedDungeonPlayer.deserialize(player);
    }
    return plainToInstance(SpeedDungeonGame, game);
  }

  /** returns the name of the party and if the party was removed from the game (in the case of its last member being removed) */
  removePlayerFromParty(username: string): Error | RemovedPlayerData {
    const player = this.players[username];
    const charactersRemoved: Combatant[] = [];
    if (!player) return new Error("No player found to remove");
    if (!player.partyName)
      return { partyNameLeft: null, partyWasRemoved: false, charactersRemoved };

    const partyLeaving = this.adventuringParties[player.partyName];
    if (!partyLeaving) return new Error("No party exists");

    // if a removed character was taking their turn, end their turn
    const battleOption = this.getBattleOption(partyLeaving.battleId);

    const characterIds = cloneDeep(player.characterIds);
    if (characterIds) {
      Object.values(characterIds).forEach((characterId) => {
        const removedCharacterResult = partyLeaving.removeCharacter(characterId, player);
        if (removedCharacterResult instanceof Error) return removedCharacterResult;
        charactersRemoved.push(removedCharacterResult);
        delete this.lowestStartingFloorOptionsBySavedCharacter[characterId];
      });
    }

    battleOption?.turnOrderManager.updateTrackers(this, partyLeaving);

    player.partyName = null;

    ArrayUtils.removeElement(partyLeaving.playerUsernames, username);

    if (partyLeaving.playerUsernames.length < 1) {
      delete this.adventuringParties[partyLeaving.name];
      return { partyNameLeft: partyLeaving.name, partyWasRemoved: true, charactersRemoved };
    }

    return { partyNameLeft: partyLeaving.name, partyWasRemoved: false, charactersRemoved };
  }

  removePlayer(username: string) {
    const removedPlayerResult = this.removePlayerFromParty(username);
    if (removedPlayerResult instanceof Error) return removedPlayerResult;
    delete this.players[username];
    ArrayUtils.removeElement(this.playersReadied, username);
    return removedPlayerResult;
  }

  putPlayerInParty(partyName: string, username: string) {
    const party = this.adventuringParties[partyName];
    if (!party) throw new Error("Tried to put a player in a party but the party didn't exist");
    const player = this.players[username];
    if (!player) {
      throw new Error("Tried to put a player in a party but couldn't find the player in game game");
    }

    party.playerUsernames.push(username);
    player.partyName = partyName;
  }

  togglePlayerReadyToStartGameStatus(username: string) {
    if (this.playersReadied.includes(username))
      ArrayUtils.removeElement(this.playersReadied, username);
    else this.playersReadied.push(username);
  }

  addParty(party: AdventuringParty) {
    this.adventuringParties[party.name] = party;
  }

  getCombatantById(entityId: string): Error | Combatant {
    for (const party of Object.values(this.adventuringParties)) {
      const combatantOption = party.combatantManager.getCombatantOption(entityId);
      const combatantWasFound = combatantOption !== undefined;
      if (combatantWasFound) return combatantOption;
    }

    return new Error(`${ERROR_MESSAGES.COMBATANT.NOT_FOUND}: Entity Id: ${entityId}`);
  }

  getPartyOfCombatant(combatantId: string): Error | AdventuringParty {
    for (const party of Object.values(this.adventuringParties)) {
      const { combatantManager } = party;
      const combatantOption = combatantManager.getCombatantOption(combatantId);
      const combatantExistsInThisParty = combatantOption !== undefined;
      if (combatantExistsInThisParty) return party;
    }

    return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
  }

  getPlayerPartyOption(username: string): Error | AdventuringParty | undefined {
    const playerOption = this.players[username];
    if (!playerOption) return new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const partyNameOption = playerOption.partyName;
    if (!partyNameOption) return undefined;
    const partyOption = this.adventuringParties[partyNameOption];
    if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    return partyOption;
  }

  getBattleOption(battleIdOption: null | string) {
    if (!battleIdOption) return undefined;
    return this.battles[battleIdOption];
  }
}

export type RemovedPlayerData = {
  partyNameLeft: null | string;
  partyWasRemoved: boolean;
  charactersRemoved: Combatant[];
};
