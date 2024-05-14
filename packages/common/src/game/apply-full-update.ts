import { SpeedDungeonGame, SpeedDungeonPlayer } from ".";
import { AdventuringParty } from "../adventuring_party";

export default function applyFullUpdate(this: SpeedDungeonGame, update: SpeedDungeonGame) {
  Object.assign(this, update);
  this.players = {};
  Object.entries(update.players).forEach(([name, playerData]) => {
    const player = new SpeedDungeonPlayer(name);
    Object.assign(player, playerData);
    this.players[player.username] = player;
  });

  this.adventuringParties = {};
  if (update.adventuringParties) {
    Object.entries(update.adventuringParties).forEach(([partyName, partyData]) => {
      const party = new AdventuringParty(partyData.name);
      party.applyFullUpdate(partyData);
      this.adventuringParties[partyName] = partyData;
    });
  }
}
