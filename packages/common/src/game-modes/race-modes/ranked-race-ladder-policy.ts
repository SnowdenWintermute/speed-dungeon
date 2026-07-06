import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

// TODO
// switch on game control scheme to determine which ladder to save to

export class RankedRaceModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override onFloorDescent(): Promise<void> {
    // update the race game party record's "deepest floor" field
    throw new Error("Method not implemented.");
  }

  override onGameStart(): Promise<void> {
    // insert the initial race game ladder record
    // - race game record
    // - race game party records
    // - race game character records
    throw new Error("Method not implemented.");
  }

  override async onLiveGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    // update the leaving player's race game character record levels
    throw new Error("tbd");
  }

  override onLastPlayerLeftLiveGame(): Promise<void> {
    // mark the race game record as "completed"
    throw new Error("tbd");
  }

  override onPartyEscape(): Promise<void> {
    // update the race game character records for the party
    // mark the race game party record's "fate" as "Escaped"
    // mark the "time fate recorded at" as Date.now()

    // get all race game party records for this game
    // check other party's escape times if they escaped
    // message players that "party x escaped in y'th place", you may still claim "z'th place" if your party escapes
    throw new Error("tbd");
  }

  override async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty) {
    return undefined;
    // update the race game character levels for characters in the party
    // mark the race game party record's "fate" as "Wiped"
    // mark the "time fate recorded at" as Date.now()

    // if all parties are wiped, mark the race game record as completed

    // if there is only one party left, tell them they are the last ones left alive
    // but they must escape to claim victory
  }

  override async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ) {
    return undefined;
  }
}
