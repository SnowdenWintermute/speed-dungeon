import {
  Combatant,
  EntityId,
  GameListEntry,
  UserChannelDisplayData,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class LobbyStore {
  private gameList: GameListEntry[] = [];
  private usersInChannel = new Map<string, UserChannelDisplayData>();
  private savedCharacterSlots: Record<number, { combatant: Combatant; pets: Combatant[] } | null> =
    {};

  constructor() {
    // we autoBind because that allows us to pass methods of this class
    // to callbacks like socket.on(ServerToClientEvent.UserLeftChannel, lobbyStore.handleUserLeftChannel);
    // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setGameList(newList: GameListEntry[]) {
    this.gameList = newList;
  }

  getGameList() {
    return this.gameList;
  }

  updateChannel(channelName: string, users: Map<Username, UserChannelDisplayData>) {
    this.usersInChannel.clear();

    Array.from(users.entries()).forEach(([username, displayData]) => {
      this.usersInChannel.set(username, displayData);
    });
  }

  handleUserJoinedChannel(username: string, userChannelDisplayData: UserChannelDisplayData) {
    this.usersInChannel.set(username, userChannelDisplayData);
  }

  handleUserLeftChannel(username: string) {
    this.usersInChannel.delete(username);
  }

  getUsersList() {
    return Array.from(this.usersInChannel);
  }

  getSavedCharacterSlots() {
    return this.savedCharacterSlots;
  }

  setSavedCharacterSlots(
    characters: Record<number, { combatant: Combatant; pets: Combatant[] } | null>
  ) {
    this.savedCharacterSlots = characters;
  }

  setSavedCharacterSlot(
    characterOption: { combatant: Combatant; pets: Combatant[] } | null,
    slot: number
  ) {
    this.savedCharacterSlots[slot] = characterOption;
  }

  getSavedCharacterOption(entityId: EntityId) {
    for (const [slotNumberString, savedCharacterSlot] of Object.entries(this.savedCharacterSlots)) {
      if (savedCharacterSlot?.combatant.entityProperties.id === entityId) return savedCharacterSlot;
    }
  }

  deleteSavedCharacter(entityId: EntityId) {
    for (const [slotStringKey, characterOption] of Object.entries(this.savedCharacterSlots)) {
      const slotNumber = parseInt(slotStringKey);
      if (characterOption?.combatant.entityProperties.id !== entityId) continue;
      this.savedCharacterSlots[slotNumber] = null;
      break;
    }
  }
}
