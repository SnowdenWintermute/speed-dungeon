import { Combatant, EntityId, GameListEntry, UserChannelDisplayData } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class LobbyStore {
  public websocketConnected: boolean = true;
  public gameList: GameListEntry[] = [];
  private mainChannelName: string = "";
  private usersInChannel = new Map<string, UserChannelDisplayData>();
  private savedCharacterSlots: Record<number, Combatant | null> = {};
  constructor() {
    // we autoBind because that allows us to pass methods of this class
    // to callbacks like socket.on(ServerToClientEvent.UserLeftChannel, lobbyStore.handleUserLeftChannel);
    // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    makeAutoObservable(this, {}, { autoBind: true });
  }

  updateChannel(
    channelName: string,
    users: { username: string; userChannelDisplayData: UserChannelDisplayData }[]
  ) {
    this.mainChannelName = channelName;
    this.usersInChannel.clear();
    users.forEach(({ username, userChannelDisplayData }) => {
      this.usersInChannel.set(username, userChannelDisplayData);
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

  setSavedCharacterSlots(characters: Record<number, Combatant | null>) {
    this.savedCharacterSlots = characters;
  }

  setSavedCharacterSlot(characterOption: Combatant | null, slot: number) {
    this.savedCharacterSlots[slot] = characterOption;
  }

  getSavedCharacterOption(entityId: EntityId) {
    for (const [slotNumberString, combatantOption] of Object.entries(this.savedCharacterSlots)) {
      if (combatantOption?.entityProperties.id === entityId) return combatantOption;
    }
  }

  deleteSavedCharacter(entityId: EntityId) {
    for (const [slotStringKey, characterOption] of Object.entries(this.savedCharacterSlots)) {
      const slotNumber = parseInt(slotStringKey);
      if (characterOption?.entityProperties.id !== entityId) continue;
      this.savedCharacterSlots[slotNumber] = null;
      break;
    }
  }
}
