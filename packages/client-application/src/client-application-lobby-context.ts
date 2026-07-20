import {
  CharacterControlScheme,
  Combatant,
  CombatantId,
  EntityId,
  GameId,
  GameListEntry,
  ReactiveNode,
  SavedIronmanRun,
  SavedIronmanRunClientEntry,
  SpeedDungeonGame,
  UserChannelDisplayData,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export interface ClientSavedCharacter {
  combatant: Combatant;
  pets: Combatant[];
}

export class ClientApplicationLobbyContext implements ReactiveNode {
  private _gameList: GameListEntry[] = [];
  readonly savedCharacters = new ClientApplicationSavedCharacters();
  readonly savedIronmanRuns = new Map<GameId, SavedIronmanRunClientEntry>();
  public savedIronmanRunCapacity: null | number = null; // wait to hear from server your account's run capacity
  private _selectedSavedIronmanRun: null | GameId = null;
  private _selectedControlScheme = CharacterControlScheme.Captain;
  readonly channel = new ClientApplicationLobbyChannel();

  makeObservable() {
    makeAutoObservable(this);
    this.savedCharacters.makeObservable();
  }

  setGameList(newList: GameListEntry[]) {
    this._gameList = newList;
  }

  get gameList() {
    return [...this._gameList];
  }

  get selectedSavedIronmanRun() {
    return this._selectedSavedIronmanRun;
  }

  set selectedSavedIronmanRun(value: null | GameId) {
    this._selectedSavedIronmanRun = value;
  }

  get selectedControlScheme() {
    return this._selectedControlScheme;
  }

  set selectedControlScheme(value: CharacterControlScheme) {
    this._selectedControlScheme = value;
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

class ClientApplicationSavedCharacters implements ReactiveNode {
  private _byControlScheme: Record<CharacterControlScheme, ClientSavedCharacter[]> = {
    [CharacterControlScheme.Captain]: [],
    [CharacterControlScheme.Freelancer]: [],
  };
  public capacities: Record<CharacterControlScheme, number> = {
    [CharacterControlScheme.Captain]: 0,
    [CharacterControlScheme.Freelancer]: 0,
  };

  makeObservable() {
    makeAutoObservable(this);
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
