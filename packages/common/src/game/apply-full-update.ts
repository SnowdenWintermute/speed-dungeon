import { SpeedDungeonGame, SpeedDungeonPlayer } from ".";
import { AdventuringParty } from "../adventuring_party";
import { Battle } from "../battle";

export default function applyFullUpdate(this: SpeedDungeonGame, update: SpeedDungeonGame) {
  this.players = new Map();

  for (const [username, playerData] of update.players.entries()) {
    const player = new SpeedDungeonPlayer(username);
    Object.assign(player, playerData);
    this.players.set(player.username, player);
  }
  this.playersReadied = new Set();
  for (const playerReadied of Object.keys(update.playersReadied)) {
    this.playersReadied.add(playerReadied);
  }
  this.adventuringParties = new Map();
  update.adventuringParties?.forEach((partyData) => {
    const party = new AdventuringParty(partyData.name);
    party.applyFullUpdate(partyData);
    Object.assign(party, partyData);
    this.adventuringParties.set(partyData.name, party);
  });
  this.battles = new Map();
  update.battles?.forEach((battleData) => {
    const battle = new Battle(battleData.id, battleData.groupA, battleData.groupB);
    this.battles.set(battleData.id, battle);
  });
  this.timeStarted = update.timeStarted;
}
