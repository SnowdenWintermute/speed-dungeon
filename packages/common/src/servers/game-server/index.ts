import { SpeedDungeonGame } from "../../game/index.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { GameId } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { ActiveGameStatus } from "../services/game-session-store/active-game-status.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  identityProviderService: IdentityProviderService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
}

export class GameServer {
  private readonly games = new Map<GameId, SpeedDungeonGame>();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly updateGateway = new OutgoingMessageGateway<GameStateUpdate, ClientIntent>();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly outgoingMessagesToUsersGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();

  // controllers
  // public readonly gameLifecycleController: GameLifecycleController;
  // public readonly sessionLifecycleController: SessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices
  ) {
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    endpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const sessionClaimTokenOption = identityResolutionContext.gameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    // @TODO - decrypt and validate the token
    const token = sessionClaimTokenOption;

    let existingGame = this.games.get(token.gameId);
    // this means this is the first user to join this game
    if (existingGame === undefined) {
      existingGame = await this.initializeExpectedPendingGame(token.gameId);
    }

    // - create the UserSession and assign it to the user's connection
    // - place the UserSession in the Game
    // - if all Players in Game have a corresponding expected UserSession
    //   - if the game has not yet started
    //     - handle any game mode specific onStart business
    //     - start accepting player inputs
    //     - start a heartbeat loop to periodically update the ActiveGame record's lastHeartbeatTimestamp
    //       in the central store
    //   - if the game was in progress
    //     - this was a reconnection for a disconnected user
    //     - unpause acceptance of player inputs

    // const newSession = await this.sessionLifecycleController.createUserSession(
    //   transportEndpoint.id,
    //   identityResolutionContext
    // );

    // if (newSession.userId !== null) {
    //   this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId);
    // }

    // const outbox = await this.sessionLifecycleController.connectionHandler(
    //   newSession,
    //   transportEndpoint
    // );
    // this.dispatchOutboxMessages(outbox);
  }

  private async initializeExpectedPendingGame(gameId: GameId) {
    const { gameSessionStoreService } = this.externalServices;
    const pendingGameSetupOption = await gameSessionStoreService.getPendingGameSetup(gameId);
    if (pendingGameSetupOption === null) {
      throw new Error(
        "A user presented a token with a game id that didn't match any existing game or pending game setup."
      );
    }

    const newGame = SpeedDungeonGame.getDeserialized(pendingGameSetupOption.game);
    this.games.set(newGame.id, newGame);
    gameSessionStoreService.deletePendingGameSetup(newGame.id);

    gameSessionStoreService.writeActiveGameStatus(
      newGame.id,
      new ActiveGameStatus(newGame.name, newGame.id)
    );

    return newGame;
  }

  private dispatchUserOutboxMessages(outbox: MessageDispatchOutbox<GameStateUpdate>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessagesToUsersGateway.submitToConnection(
            dispatch.connectionId,
            dispatch.message
          );
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessagesToUsersGateway.submitToConnections(
            dispatch.connectionIds,
            dispatch.message
          );
          break;
      }
    }
  }
}
