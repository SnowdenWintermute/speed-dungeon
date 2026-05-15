import { ClientSequentialEvent } from "../../packets/client-sequential-events.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { PartyDelayedGameMessageFactory } from "../../servers/game-server/party-delayed-game-message-factory.js";
import { CrossServerBroadcasterService } from "../../servers/services/cross-server-broadcaster/index.js";
import { RankedLadderService } from "../../servers/services/ranked-ladder.js";
import { ServerCommand } from "../../servers/services/server-command/index.js";
import { UserSessionRegistry } from "../../servers/sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../servers/update-delivery/message-dispatch-factory.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class IronmanModeLadderPolicy implements GameModeLadderUpdatePolicy {
  constructor(
    private userSessionRegistry: UserSessionRegistry,
    private rankedLadderService: RankedLadderService,
    private updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory,
    private crossServerBroadcasterService: CrossServerBroadcasterService<
      GameStateUpdate,
      ServerCommand
    >
  ) {}

  async onFloorDescent(): Promise<void> {
    // - save the "ironman party ladder record" with Players and characters
    //   {name:EntityName,combatantClass: CombatantClass,experience: number }[]
    // - add an "ironman ladder floor reached" in x ms record referencing the party id
    // - update the ironman party ladder record to reference the new "floor reached record"
    // - create and link a similar "time spent on floor" record
    // - update the player's profiles to reference the "ironman ladder party record"
    throw new Error("Method not implemented.");
  }

  async onGameStart(): Promise<void> {
    // not worth update ladder until they complete at least one floor
    return;
  }

  async onGameLeave(): Promise<ClientSequentialEvent[]> {
    return [];
  }

  async onLastPlayerLeftGame(): Promise<void> {
    return;
  }

  async onPartyEscape(): Promise<void> {
    // save a "run completed" ladder record with any interesting metadata
    throw new Error("Method not implemented.");
  }

  async onPartyWipe() {
    return undefined;
  }

  async onPartyBattleVictory() {
    return undefined;
  }
}
