import {
  Combatant,
  CombatantId,
  GameListEntry,
  UserChannelDisplayData,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ClientApplicationLobbyContext {
  private _gameList: GameListEntry[] = [];
  readonly savedCharacters = new ClientApplicationSavedCharacters();
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
}

class ClientApplicationSavedCharacters {
  private _slots: Record<number, { combatant: Combatant; pets: Combatant[] } | null> = {};

  constructor() {
    makeAutoObservable(this);
  }

  get slots() {
    return this._slots;
  }

  setSlots(characters: Record<number, { combatant: Combatant; pets: Combatant[] } | null>) {
    this._slots = characters;
  }

  setSlot(characterOption: { combatant: Combatant; pets: Combatant[] } | null, slot: number) {
    this.slots[slot] = characterOption;
  }

  getSavedCharacterOption(combatantId: CombatantId) {
    for (const [_slotNumberString, savedCharacterSlot] of Object.entries(this.slots)) {
      if (savedCharacterSlot?.combatant.getEntityId() === combatantId) {
        return savedCharacterSlot;
      }
    }
  }

  deleteSavedCharacter(combatantId: CombatantId) {
    for (const [slotStringKey, characterOption] of Object.entries(this.slots)) {
      const slotNumber = parseInt(slotStringKey);
      if (characterOption?.combatant.getEntityId() !== combatantId) {
        continue;
      }
      this.slots[slotNumber] = null;
      break;
    }
  }
}
