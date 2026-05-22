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
  invariant,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

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

  private _slots: Record<
    CharacterControlScheme,
    Record<number, { combatant: Combatant; pets: Combatant[] } | null>
  > = {
    [CharacterControlScheme.Freelancer]: {},
    [CharacterControlScheme.Captain]: {},
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

  get slots() {
    return this._slots;
  }

  requireFilledSlot(controlScheme: CharacterControlScheme, slotIndex: number) {
    const slotContents = this.slots[controlScheme][slotIndex];
    invariant(slotContents !== null && slotContents !== undefined);
    return slotContents;
  }

  setSlots(
    controlScheme: CharacterControlScheme,
    characters: Record<number, { combatant: Combatant; pets: Combatant[] } | null>
  ) {
    this._slots[controlScheme] = characters;
  }

  setSlot(
    controlScheme: CharacterControlScheme,
    characterOption: { combatant: Combatant; pets: Combatant[] } | null,
    slot: number
  ) {
    this.slots[controlScheme][slot] = characterOption;
  }

  getSavedCharacterOption(entityId: EntityId) {
    for (const controlSchemeSlots of Object.values(this.slots)) {
      for (const savedCharacterSlot of Object.values(controlSchemeSlots)) {
        if (savedCharacterSlot?.combatant.getEntityId() === entityId) {
          return savedCharacterSlot;
        }
      }
    }
  }

  deleteSavedCharacter(combatantId: CombatantId) {
    for (const controlSchemeSlots of Object.values(this.slots)) {
      for (const [slotStringKey, savedCharacterSlot] of Object.entries(controlSchemeSlots)) {
        if (savedCharacterSlot?.combatant.getEntityId() === combatantId) {
          const slotNumber = parseInt(slotStringKey);
          controlSchemeSlots[slotNumber] = null;
        }
      }
    }
  }
}
