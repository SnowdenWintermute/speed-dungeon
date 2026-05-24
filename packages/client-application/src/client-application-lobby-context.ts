import {
  CharacterControlScheme,
  Combatant,
  CombatantId,
  EntityId,
  GameId,
  GameListEntry,
  SavedIronmanRun,
  SpeedDungeonGame,
  UserChannelDisplayData,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export interface ClientSavedCharacter {
  combatant: Combatant;
  pets: Combatant[];
}

export class ClientApplicationLobbyContext {
  private _gameList: GameListEntry[] = [];
  readonly savedCharacters = new ClientApplicationSavedCharacters();
  readonly savedIronmanRuns = new Map<GameId, SavedIronmanRun>();
  public savedIronmanRunCapacity: null | number = null; // wait to hear from server your account's run capacity
  public selectedSavedIronmanRun: null | GameId = null;
  readonly channel = new ClientApplicationLobbyChannel();

  constructor() {
    makeAutoObservable(this);
  }

  setGameList(newList: GameListEntry[]) {
    this._gameList = newList;
  }

  get gameList() {
    return [...this._gameList];
  }
}

class ClientApplicationLobbyChannel {
  private usersInChannel = new Map<Username, UserChannelDisplayData>();
  constructor() {
    makeAutoObservable(this);
  }

  update(users: Map<Username, UserChannelDisplayData>) {
    this.usersInChannel.clear();
    for (const [username, displayData] of users) {
      this.usersInChannel.set(username, displayData);
    }
  }

  handleUserJoined(username: Username, userChannelDisplayData: UserChannelDisplayData) {
    this.usersInChannel.set(username, userChannelDisplayData);
  }

  handleUserLeft(username: Username) {
    this.usersInChannel.delete(username);
  }

  get usersList() {
    return Array.from(this.usersInChannel);
  }

  getSavedCharactersForGame(game: SpeedDungeonGame) {
    //
  }
}

class ClientApplicationSavedCharacters {
  private _selectedCharacterControlScheme = CharacterControlScheme.Freelancer;

  private _byControlScheme: Record<CharacterControlScheme, ClientSavedCharacter[]> = {
    [CharacterControlScheme.Freelancer]: [],
    [CharacterControlScheme.Captain]: [],
  };

  constructor() {
    makeAutoObservable(this);
  }

  get selectedCharacterControlScheme() {
    return this._selectedCharacterControlScheme;
  }

  set selectedCharacterControlScheme(value: CharacterControlScheme) {
    this._selectedCharacterControlScheme = value;
  }

  get byControlScheme() {
    return this._byControlScheme;
  }

  setCharacters(controlScheme: CharacterControlScheme, characters: ClientSavedCharacter[]) {
    this._byControlScheme[controlScheme] = characters;
  }

  appendCharacter(controlScheme: CharacterControlScheme, character: ClientSavedCharacter) {
    this._byControlScheme[controlScheme].push(character);
  }

  getSavedCharacterOption(entityId: EntityId) {
    for (const characters of Object.values(this._byControlScheme)) {
      for (const character of characters) {
        if (character.combatant.getEntityId() === entityId) {
          return character;
        }
      }
    }
  }

  deleteSavedCharacter(combatantId: CombatantId) {
    for (const characters of Object.values(this._byControlScheme)) {
      const index = characters.findIndex((c) => c.combatant.getEntityId() === combatantId);
      if (index !== -1) {
        characters.splice(index, 1);
      }
    }
  }
}
