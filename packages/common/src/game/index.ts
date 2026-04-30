import { AdventuringParty } from "../adventuring-party/index.js";
import { Battle } from "../battle/index.js";
import { SpeedDungeonPlayer } from "./player.js";
import { GameMode } from "../types.js";
import { GAME_CONFIG, MAX_PARTY_SIZE } from "../app-consts.js";
import { makeAutoObservable } from "mobx";
import { ArrayUtils } from "../utils/array-utils.js";
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
import {
  ReactiveNode,
  Serializable,
  SerializedOf,
  makePropertiesObservable,
} from "../serialization/index.js";
import { MapUtils } from "../utils/map-utils.js";

export class SpeedDungeonGame implements Serializable, ReactiveNode {
  players = new Map<Username, SpeedDungeonPlayer>();
  playerCapacity: number | null = null;
  playersReadied: Username[] = [];
  adventuringParties = new Map<PartyName, AdventuringParty>();
  battles = new Map<EntityId, Battle>();
  private timeStarted: null | number = null;
  timeHandedOff: null | number = null;
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
  }

  makeObservable() {
    makeAutoObservable(this);
    for (const [_, player] of this.players) {
      player.makeObservable();
    }
    for (const [_, party] of this.adventuringParties) {
      party.makeObservable();
    }
    for (const [_, battle] of this.battles) {
      battle.makeObservable();
    }
    makePropertiesObservable(this);
  }

  toSerialized() {
    return {
      id: this.id,
      name: this.name,
      mode: this.mode,
      gameCreator: this.gameCreator,
      isRanked: this.isRanked,
      players: MapUtils.serialize(this.players, (v) => v.toSerialized()),
      playerCapacity: this.playerCapacity,
      playersReadied: this.playersReadied,
      adventuringParties: MapUtils.serialize(this.adventuringParties, (v) => v.toSerialized()),
      battles: MapUtils.serialize(this.battles, (v) => v.toSerialized()),
      timeStarted: this.timeStarted,
      timeHandedOff: this.timeHandedOff,
      selectedStartingFloor: this.selectedStartingFloor,
      inputLock: this.inputLock.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<SpeedDungeonGame>) {
    const { id, name, mode, gameCreator, isRanked } = serialized;
    const result = new SpeedDungeonGame(id, name, mode, gameCreator, isRanked);
    result.players = MapUtils.deserialize(serialized.players, (v) =>
      SpeedDungeonPlayer.fromSerialized(v)
    );
    result.playerCapacity = serialized.playerCapacity;
    result.playersReadied = serialized.playersReadied;
    result.adventuringParties = MapUtils.deserialize(serialized.adventuringParties, (v) =>
      AdventuringParty.fromSerialized(v)
    );
    result.battles = MapUtils.deserialize(serialized.battles, (v) => Battle.fromSerialized(v));
    result.timeStarted = serialized.timeStarted;
    result.timeHandedOff = serialized.timeHandedOff;
    result.selectedStartingFloor = serialized.selectedStartingFloor;
    result.inputLock = ReferenceCountedLock.fromSerialized<UserId>(serialized.inputLock);

    return result;
  }

  initializeBattlesOnDeserialization() {
    for (const [_, party] of this.adventuringParties) {
      const battleOption = party.getBattleOption(this);
      if (battleOption) {
        battleOption.initializeAfterDeserialization(this, party);
        console.info("initialized battle", battleOption.id);
      }
    }
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

    if (this.adventuringParties.size < minimumNumberOfParties) {
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
      throw new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
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
    player.characterIds.push(character.getEntityId());

    party.petManager.setCombatantPets(characterId, pets);

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
    });

    battleOption?.turnOrderManager.updateTrackers(this, partyLeaving);

    player.partyName = null;

    ArrayUtils.removeElement(partyLeaving.playerUsernames, username);

    if (partyLeaving.playerUsernames.length < 1) {
      this.adventuringParties.delete(partyLeaving.name);
      // if we one day allow two parties to be in one battle this will need to change
      if (battleOption) {
        this.battles.delete(battleOption.id);
      }
      return { partyNameLeft: partyLeaving.name, partyWasRemoved: true, charactersRemoved };
    }

    return { partyNameLeft: partyLeaving.name, partyWasRemoved: false, charactersRemoved };
  }

  removePlayer(username: Username) {
    const removedPlayerResult = this.removePlayerFromParty(username);
    this.players.delete(username);
    ArrayUtils.removeElement(this.playersReadied, username);
    return removedPlayerResult;
  }

  putPlayerInParty(partyName: PartyName, username: Username) {
    const party = this.getExpectedParty(partyName);
    const player = this.getExpectedPlayer(username);

    if (party.playerUsernames.includes(username)) {
      player.partyName = partyName;
      // we are patching the fact that server removes and adds back players when they
      // leave the lobby then rejoin in the game server, really we should mark some
      // users awaiting connection instead of this
      return;
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
    this.adventuringParties.set(party.name, party);
  }

  // deprecated - use getExpectedCombatant
  getCombatantById(entityId: string) {
    for (const [_, party] of this.adventuringParties) {
      const combatantOption = party.combatantManager.getCombatantOption(entityId);
      const combatantWasFound = combatantOption !== undefined;
      if (combatantWasFound) {
        return combatantOption;
      }
    }

    return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND(entityId));
  }

  getExpectedCombatant(entityId: CombatantId) {
    for (const [_, party] of this.adventuringParties) {
      const combatantOption = party.combatantManager.getCombatantOption(entityId);
      const combatantWasFound = combatantOption !== undefined;
      if (combatantWasFound) {
        return combatantOption;
      }
    }

    throw new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND(entityId));
  }

  getPartyOptionOfCombatant(combatantId: string) {
    for (const [_, party] of this.adventuringParties) {
      const { combatantManager } = party;
      const combatantOption = combatantManager.getCombatantOption(combatantId);
      const combatantExistsInThisParty = combatantOption !== undefined;
      if (combatantExistsInThisParty) return party;
    }

    return undefined;
  }

  getPlayerPartyOption(username: Username): AdventuringParty | undefined {
    const player = this.getExpectedPlayer(username);
    const partyNameOption = player.partyName;
    if (!partyNameOption) {
      return undefined;
    }
    return this.getExpectedParty(partyNameOption);
  }

  getBattleOption(battleIdOption: null | string) {
    if (!battleIdOption) {
      return undefined;
    }
    return this.battles.get(battleIdOption);
  }

  /** Deepest floor that each selected character in the party has reached */
  get maxStartingFloor() {
    const partyOption = [...this.adventuringParties.values()][0];
    if (!partyOption) {
      return 1;
    }

    const floors = partyOption.combatantManager
      .getPartyMemberCharacters()
      .map((c) => c.combatantProperties.deepestFloorReached);
    const maxFloor = Math.min(...floors);

    return maxFloor;
  }

  /** Deepest floor that ANY selected character in the party has reached */
  get potentialMaxStartingFloor() {
    const partyOption = [...this.adventuringParties.values()][0];
    if (!partyOption) {
      return 1;
    }

    const maxFloor = Math.max(
      1,
      ...partyOption.combatantManager
        .getPartyMemberCharacters()
        .map((c) => c.combatantProperties.deepestFloorReached)
    );

    return maxFloor;
  }
  getExpectedParty(partyName: PartyName) {
    const result = this.adventuringParties.get(partyName);
    if (!result) {
      throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    }
    return result;
  }

  allPartiesWiped() {
    for (const [_, party] of this.adventuringParties) {
      if (party.timeOfWipe === null) {
        return false;
      }
    }
    return true;
  }

  getExpectedBattle(battleId: string) {
    const expectedBattle = this.battles.get(battleId);
    if (!expectedBattle) {
      throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    }
    return expectedBattle;
  }
}

export interface RemovedPlayerData {
  partyNameLeft: null | string;
  partyWasRemoved: boolean;
  charactersRemoved: Combatant[];
}
