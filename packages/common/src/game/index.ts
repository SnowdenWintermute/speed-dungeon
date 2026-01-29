import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { SpeedDungeonPlayer } from "./player.js";
import { GameMode } from "../types.js";
import { GAME_CONFIG, MAX_PARTY_SIZE } from "../app-consts.js";
import { makeAutoObservable } from "mobx";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ArrayUtils } from "../utils/array-utils.js";
import { runIfInBrowser } from "../utils/index.js";
import { Combatant } from "../combatants/index.js";
import cloneDeep from "lodash.clonedeep";
import { ERROR_MESSAGES } from "../errors/index.js";
import { GAME_CHANNEL_PREFIX } from "../packets/channels.js";
import {
  ChannelName,
  CombatantId,
  EntityId,
  GameId,
  GameName,
  PartyName,
  Username,
} from "../aliases.js";
import { ReferenceCountedLock } from "../primatives/reference-counted-lock.js";
import { UserId } from "../servers/sessions/user-ids.js";

export class SpeedDungeonGame {
  players = new Map<Username, SpeedDungeonPlayer>();
  playerCapacity: number | null = null;
  playersReadied: Username[] = [];
  adventuringParties: Record<PartyName, AdventuringParty> = {};
  battles: Record<EntityId, Battle> = {};
  private timeStarted: null | number = null;
  timeHandedOff: null | number = null;
  lowestStartingFloorOptionsBySavedCharacter: Record<EntityId, number> = {};
  selectedStartingFloor: number = 1;
  inputLock = new ReferenceCountedLock<UserId>();
  constructor(
    public id: GameId,
    public name: GameName,
    public mode: GameMode,
    public gameCreator: string | null = null,
    public isRanked: boolean = false
  ) {
    if (mode === GameMode.Progression) this.playerCapacity = MAX_PARTY_SIZE;
    runIfInBrowser(() => makeAutoObservable(this));
  }

  getSerialized() {
    const serialized = instanceToPlain(this) as SpeedDungeonGame;
    return serialized;
  }

  static getDeserialized(game: SpeedDungeonGame) {
    const deserializedPlayers = new Map<Username, SpeedDungeonPlayer>();
    for (const [username, player] of Object.entries(game.players)) {
      SpeedDungeonPlayer.deserialize(player);
      deserializedPlayers.set(username as Username, player);
    }

    const deserialized = plainToInstance(SpeedDungeonGame, game);
    deserialized.players = deserializedPlayers;

    deserialized.inputLock = new ReferenceCountedLock<UserId>();

    for (const [partyName, party] of Object.entries(deserialized.adventuringParties)) {
      const deserializedParty = AdventuringParty.getDeserialized(party);
      deserialized.adventuringParties[partyName as PartyName] = deserializedParty;
    }

    return deserialized;
  }

  getPlayers() {
    return this.players;
  }

  getPlayer(username: Username) {
    return this.players.get(username);
  }

  getExpectedPlayer(username: Username) {
    const result = this.players.get(username);
    if (result === undefined) {
      throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    }
    return result;
  }

  getPlayerCount() {
    return this.players.size;
  }

  addPlayer(player: SpeedDungeonPlayer) {
    this.players.set(player.username, player);
  }

  /** Used by subscribed user sessions to receive updates about this game.
   * Created by adding a standard game prefix to the game's name so as not to
   * mix up potentially identical game and party names*/
  getChannelName() {
    return `${GAME_CHANNEL_PREFIX}${this.name}` as ChannelName;
  }

  requireMode(mode: GameMode) {
    if (this.mode !== mode) {
      throw new Error(ERROR_MESSAGES.GAME.MODE);
    }
  }

  requireNotYetStarted() {
    if (this.timeStarted !== null) {
      throw new Error(ERROR_MESSAGES.GAME.ALREADY_STARTED);
    }
  }

  requireGameStartPrerequisites() {
    this.requireNotYetStarted();

    let minimumNumberOfParties = 1;
    if (this.mode === GameMode.Race && this.isRanked) {
      minimumNumberOfParties = GAME_CONFIG.MIN_RACE_GAME_PARTIES;
    }

    if (Object.keys(this.adventuringParties).length < minimumNumberOfParties) {
      throw new Error(
        `Game does not have the minimum number of parties (${minimumNumberOfParties})`
      );
    }
  }

  getTimeStarted() {
    return this.timeStarted;
  }

  requireTimeStarted() {
    if (this.timeStarted === null) {
      throw new Error("Expected the game to have been started");
    }
    return this.timeStarted;
  }

  requireInputUnlocked() {
    if (this.inputLock.isLocked) {
      throw new Error(ERROR_MESSAGES.GAME.INPUT_IS_LOCKED);
    }
  }

  setAsStarted() {
    if (this.timeStarted !== null) {
      throw new Error(ERROR_MESSAGES.GAME.ALREADY_STARTED);
    }
    this.timeStarted = Date.now();
  }

  registerPlayerFromLobbyUser(username: Username) {
    this.addPlayer(new SpeedDungeonPlayer(username));
  }

  addCharacterToParty(
    party: AdventuringParty,
    player: SpeedDungeonPlayer,
    character: Combatant,
    pets: Combatant[]
  ): EntityId {
    const { combatantManager } = party;

    const partyCharacters = combatantManager.getPartyMemberCombatants();

    const partyIsFull = partyCharacters.length >= MAX_PARTY_SIZE;

    if (partyIsFull) {
      throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);
    }

    const characterId = character.getEntityId();

    combatantManager.addCombatant(character, this);

    party.petManager.setCombatantPets(characterId, pets);

    /// Could move this out of here
    character.combatantProperties.controlledBy.controllerPlayerName = player.username;
    player.characterIds.push(characterId);
    this.lowestStartingFloorOptionsBySavedCharacter[characterId] =
      character.combatantProperties.deepestFloorReached;
    ///

    combatantManager.updateHomePositions();

    return characterId;
  }

  /** returns the name of the party and if the party was removed from the game (in the case of its last member being removed) */
  removePlayerFromParty(username: Username): RemovedPlayerData {
    const player = this.getExpectedPlayer(username);
    const charactersRemoved: Combatant[] = [];

    if (!player.partyName) {
      return { partyNameLeft: null, partyWasRemoved: false, charactersRemoved };
    }

    const partyLeaving = this.getExpectedParty(player.partyName);

    // if a removed character was taking their turn, end their turn
    const battleOption = this.getBattleOption(partyLeaving.battleId);

    // character ids will be removed when calling removeCharacter
    // and we don't want to remove them while we're still iterating them
    const characterIds = cloneDeep(player.characterIds);

    Object.values(characterIds).forEach((characterId) => {
      const removedCharacter = partyLeaving.removeCharacter(characterId, player, this);
      charactersRemoved.push(removedCharacter);
      delete this.lowestStartingFloorOptionsBySavedCharacter[characterId];
    });

    battleOption?.turnOrderManager.updateTrackers(this, partyLeaving);

    player.partyName = null;

    ArrayUtils.removeElement(partyLeaving.playerUsernames, username);

    if (partyLeaving.playerUsernames.length < 1) {
      delete this.adventuringParties[partyLeaving.name];
      // if we one day allow two parties to be in one battle this will need to change
      if (battleOption) {
        delete this.battles[battleOption.id];
      }
      return { partyNameLeft: partyLeaving.name, partyWasRemoved: true, charactersRemoved };
    }

    return { partyNameLeft: partyLeaving.name, partyWasRemoved: false, charactersRemoved };
  }

  removePlayer(username: Username) {
    const removedPlayerResult = this.removePlayerFromParty(username);
    if (removedPlayerResult instanceof Error) return removedPlayerResult;
    this.players.delete(username);
    ArrayUtils.removeElement(this.playersReadied, username);
    return removedPlayerResult;
  }

  putPlayerInParty(partyName: PartyName, username: Username) {
    const party = this.adventuringParties[partyName];
    if (!party) throw new Error("Tried to put a player in a party but the party didn't exist");
    const player = this.players.get(username);
    if (!player) {
      throw new Error("Tried to put a player in a party but couldn't find the player in game");
    }

    party.playerUsernames.push(username);
    player.partyName = partyName;
  }

  /** Returns true if all players are ready to start the game */
  togglePlayerReadyToStartGameStatus(username: Username) {
    if (this.playersReadied.includes(username)) {
      ArrayUtils.removeElement(this.playersReadied, username);
    } else {
      this.playersReadied.push(username);
    }

    const allPlayersReadied = this.allPlayersAreReadyToStart();
    const notAllPlayersAreReady = !allPlayersReadied;
    if (notAllPlayersAreReady) {
      return false;
    }

    return true;
  }

  private allPlayersAreReadyToStart() {
    for (const [username, _player] of this.getPlayers()) {
      if (this.playersReadied.includes(username)) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  addParty(party: AdventuringParty) {
    this.adventuringParties[party.name] = party;
  }

  // deprecated - use getExpectedCombatant
  getCombatantById(entityId: string) {
    for (const party of Object.values(this.adventuringParties)) {
      const combatantOption = party.combatantManager.getCombatantOption(entityId);
      const combatantWasFound = combatantOption !== undefined;
      if (combatantWasFound) {
        return combatantOption;
      }
    }

    return new Error(`${ERROR_MESSAGES.COMBATANT.NOT_FOUND}: Entity Id: ${entityId}`);
  }

  getExpectedCombatant(entityId: CombatantId) {
    for (const party of Object.values(this.adventuringParties)) {
      const combatantOption = party.combatantManager.getCombatantOption(entityId);
      const combatantWasFound = combatantOption !== undefined;
      if (combatantWasFound) {
        return combatantOption;
      }
    }

    throw new Error(`${ERROR_MESSAGES.COMBATANT.NOT_FOUND}: Entity Id: ${entityId}`);
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

  getPlayerPartyOption(username: Username): Error | AdventuringParty | undefined {
    const playerOption = this.players.get(username);
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

  getMaxStartingFloor() {
    let maxFloor;

    for (const floor of Object.values(this.lowestStartingFloorOptionsBySavedCharacter)) {
      if (!maxFloor) maxFloor = floor;
      else if (maxFloor > floor) maxFloor = floor;
    }

    return maxFloor || 1;
  }

  setMaxStartingFloor() {
    const maxStartingFloor = this.getMaxStartingFloor();
    if (this.selectedStartingFloor > maxStartingFloor) {
      this.selectedStartingFloor = maxStartingFloor;
    }
  }

  getExpectedParty(partyName: PartyName) {
    const result = this.adventuringParties[partyName];
    if (!result) {
      throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    }
    return result;
  }

  allPartiesWiped() {
    for (const party of Object.values(this.adventuringParties)) {
      if (party.timeOfWipe === null) {
        return false;
      }
    }
    return true;
  }
}

export interface RemovedPlayerData {
  partyNameLeft: null | string;
  partyWasRemoved: boolean;
  charactersRemoved: Combatant[];
}
