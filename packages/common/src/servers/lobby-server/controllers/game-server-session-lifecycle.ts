import { ConnectionId } from "../../../aliases.js";
import { GameServerIdentityResolutionContext } from "../../services/identity-provider.js";
import {
  GameServerSession,
  GameServerSessionRegistry,
} from "../../sessions/game-server-session-registry.js";

export class GameServerSessionLifecycleController {
  constructor(private readonly gameServerSessionRegistry: GameServerSessionRegistry) {}

  private requireValidIdentityToken(context: GameServerIdentityResolutionContext) {
    // @TODO - validate the HMAC token
  }

  createServerSession(connectionId: ConnectionId, context: GameServerIdentityResolutionContext) {
    // validate their context's signature
    this.requireValidIdentityToken(context);
    // make sure current session doesn't exist
    this.gameServerSessionRegistry.requireNoExistingConnection(context.gameServerId);
    return new GameServerSession(
      connectionId,
      context.gameServerId,
      context.gameServerName,
      context.gameServerUrl
    );
  }
}
