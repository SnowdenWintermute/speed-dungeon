import { SpeedDungeonGame } from "../../game/index.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { ConnectionId, GameName } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { IncomingMessageGateway } from "../incoming-message-gateway.js";

export class GameServer {
  private readonly games = new Map<GameName, SpeedDungeonGame>();
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly updateGateway = new OutgoingMessageGateway<GameStateUpdate, ClientIntent>();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  // public readonly sessionAuthManager: SessionAuthorizationManager;

  // controllers
  // public readonly gameLifecycleController: GameLifecycleController;
  // public readonly sessionLifecycleController: SessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    private readonly usersIncomingMessageGateway: IncomingMessageGateway
    // private readonly externalServices: LobbyExternalServices
  ) {
    // this.clientIntentReceiver.initialize(this);
    this.usersIncomingMessageGateway.listen();

    // this.sessionAuthManager = new SessionAuthorizationManager(externalServices.profileService);
  }

  // private intentHandlers = createLobbyClientIntentHandlers(this);

  // async handleConnection(
  //   transportEndpoint: ConnectionEndpoint<GameStateUpdate, ClientIntent>,
  //   identityResolutionContext: IdentityResolutionContext
  // ) {
  //   const newSession = await this.sessionLifecycleController.createUserSession(
  //     transportEndpoint.id,
  //     identityResolutionContext
  //   );

  //   if (newSession.userId !== null) {
  //     this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId);
  //   }

  //   const outbox = await this.sessionLifecycleController.connectionHandler(
  //     newSession,
  //     transportEndpoint
  //   );
  //   this.dispatchOutboxMessages(outbox);
  // }

  async handleIntent(clientIntent: ClientIntent, connectionId: ConnectionId) {
    // const handlerOption = this.intentHandlers[clientIntent.type];
    // if (handlerOption === undefined) {
    //   throw new Error("Lobby is not configured to handle this type of ClientIntent");
    // }
    // const fromUser = this.userSessionRegistry.getExpectedSession(connectionId);
    // // a workaround is to use "as never" for some reason
    // const outbox = await handlerOption(clientIntent.data as never, fromUser);
    // this.dispatchOutboxMessages(outbox);
  }

  // private dispatchOutboxMessages(outbox: GameStateUpdateDispatchOutbox) {
  //   for (const dispatch of outbox.toDispatches()) {
  //     switch (dispatch.type) {
  //       case GameStateUpdateDispatchType.Single:
  //         this.updateGateway.submitToConnection(dispatch.connectionId, dispatch.update);
  //         break;
  //       case GameStateUpdateDispatchType.FanOut:
  //         this.updateGateway.submitToConnections(dispatch.connectionIds, dispatch.update);
  //         break;
  //     }
  //   }
  // }
}
