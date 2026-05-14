import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { ClientSequentialEvent } from "../../packets/client-sequential-events.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { PartyDelayedGameMessageFactory } from "../../servers/game-server/party-delayed-game-message-factory.js";
import { CrossServerBroadcasterService } from "../../servers/services/cross-server-broadcaster/index.js";
import { RankedLadderService } from "../../servers/services/ranked-ladder.js";
import { ServerCommand } from "../../servers/services/server-command/index.js";
import { UserSessionRegistry } from "../../servers/sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class ProgressionModeLadderPolicy implements GameModeLadderUpdatePolicy {
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
  onFloorDescent(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onGameStart(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onBattleResult(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<ClientSequentialEvent[]> {
    throw new Error("Method not implemented.");
  }
  onLastPlayerLeftGame(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyEscape(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }
  onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }
}
