import { AdventuringParty, PlayerCharacter } from ".";
import { VecDeque } from "../vecdeque";

export default function applyFullUpdate(this: AdventuringParty, update: AdventuringParty) {
  Object.assign(this, update);
  this.playerUsernames = new Set();
  update.playerUsernames.forEach((username) => this.playerUsernames.add(username));
  this.playersReadyToExplore = new Set();
  update.playersReadyToExplore.forEach((username) => this.playerUsernames.add(username));
  this.playersReadyToDescend = new Set();
  update.playersReadyToDescend.forEach((username) => this.playerUsernames.add(username));
  this.characters = new Map();
  for (const [id, characterData] of update.characters.entries()) {
    const character = new PlayerCharacter();
    Object.assign(character, characterData);
    this.characters.set(id, character);
  }
  this.currentRoom = update.currentRoom;
  this.unexploredRooms = new VecDeque();
  while (update.unexploredRooms.getSize() > 0) {
    this.unexploredRooms.pushBack(update.unexploredRooms.popFront()!);
  }
  // client doesn't care about this:
  // this.itemsOnGroundNotYetReceivedByAllClients = new Map();
}
