import isMatch from "lodash.ismatch";
import {
  GAME_STATE_UPDATE_TYPE_STRINGS,
  GameStateUpdate,
  GameStateUpdateType,
} from "../packets/game-state-updates.js";
import { GuestSessionReconnectionToken, Milliseconds, Username } from "../aliases.js";
import { ClientIntent } from "../packets/client-intents.js";
import { ConnectionEndpoint } from "../transport/connection-endpoint.js";
import { GameServerConnectionInstructions } from "../servers/lobby-server/game-handoff/connection-instructions.js";
import { ClientEndpointFactory } from "../servers/tests/fixtures/test-connection-endpoint-factories.js";
import { QUERY_PARAMS } from "../servers/query-params.js";
import { SpeedDungeonGame } from "../game/index.js";

type GameStateUpdateOfType<T extends GameStateUpdateType> = Extract<GameStateUpdate, { type: T }>;

export class TestClient {
  private _connectionEndpoint: ConnectionEndpoint | null = null;
  private _username: Username | null = null;
  private _currentGame: null | SpeedDungeonGame = null;
  private _cachedReconnectionToken: null | GuestSessionReconnectionToken = null;

  initializeEndpoint(endpoint: ConnectionEndpoint) {
    const connectionEndpoint = endpoint;
    this._connectionEndpoint = connectionEndpoint;
  }

  async close() {
    // race condition explained:
    // - we close the connectionEndpoint
    // - server is listening for "close" event, but it doesn't fire until the OS
    //   completes the connectionEndpoint cleanup (shutdown, resource release, etc.)
    // - we open a new connectionEndpoint in our code
    // - server is listening for "connection" event, which fires after the OS
    //   completes the TCP handshake for the new connection
    // - these are two independent I/O operations - whichever completes first
    //   will have its event queued and handler run first
    // - on localhost, the new connection handshake can complete faster than
    //   the old connectionEndpoint's cleanup, causing "connection" to fire before "close"
    await new Promise<void>((resolve) => {
      this.connectionEndpoint.once("close", () => resolve());
      this.connectionEndpoint.close();
    });
  }

  async connect() {
    const usernameAssignment = this.awaitGameStateUpdate(GameStateUpdateType.ClientUsername).then(
      (message) => {
        this._username = message.data.username;
      }
    );
    const reconnectionInstructions = this.awaitGameStateUpdate(
      GameStateUpdateType.GameServerConnectionInstructions
    );

    await new Promise<void>((resolve, reject) => {
      const onOpen = async () => {
        try {
          const connectionMessage = await Promise.any([
            usernameAssignment,
            reconnectionInstructions,
          ]);
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      const onClose = (code: number) => {
        cleanup();
        reject(new Error(`WebSocket closed with code ${code}`));
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.connectionEndpoint.off("open", onOpen);
        this.connectionEndpoint.off("close", onClose);
        this.connectionEndpoint.off("error", onError);
      };

      this.connectionEndpoint.once("open", onOpen);
      this.connectionEndpoint.once("close", onClose);
      this.connectionEndpoint.once("error", onError);
    });
  }

  get username() {
    if (this._username === null) {
      throw new Error("Socket not initialized");
    }
    return this._username;
  }

  get connectionEndpoint() {
    if (this._connectionEndpoint === null) {
      throw new Error("Socket not initialized");
    }
    return this._connectionEndpoint;
  }

  async sendMessageAndAwaitReplyType<T extends GameStateUpdateType>(
    message: ClientIntent,
    expectedReplyType: T,
    options?: { logMessage?: boolean; expectedData?: any }
  ): Promise<GameStateUpdateOfType<T>> {
    const messageFromServerListener = this.awaitGameStateUpdate(
      expectedReplyType,
      options?.expectedData
    );
    this.connectionEndpoint.send(JSON.stringify(message));

    const messageFromServer = await messageFromServerListener;
    if (options?.logMessage) {
      console.info(messageFromServer);
    }
    return messageFromServer;
  }

  static MESSAGE_WAIT_TIMEOUT = 300 as Milliseconds;

  startLoggingMessages() {
    const onMessage = (rawData: string) => {
      const typedMessage = TestClient.getTypedMessage(rawData);
      console.info(
        "test client message receipt:",
        GAME_STATE_UPDATE_TYPE_STRINGS[typedMessage.type],
        typedMessage
      );
    };
    this.connectionEndpoint.on("message", onMessage);
  }

  async awaitGameStateUpdate<T extends GameStateUpdateType>(
    expectedReplyType: T,
    expectedData?: any
  ): Promise<GameStateUpdateOfType<T>> {
    const connectionEndpoint = this.connectionEndpoint;
    const messages: GameStateUpdate[] = [];

    return new Promise<GameStateUpdateOfType<T>>((resolve, reject) => {
      const onMessage = (rawData: string) => {
        const typedMessage = TestClient.getTypedMessage(rawData);
        messages.push(typedMessage); // so we can see what we got if it fails

        const matchingType = typedMessage.type === expectedReplyType;
        const noDataMatchRequired = expectedData === undefined;
        const dataIsMatch = isMatch(typedMessage.data, expectedData);
        const matchingDataOrNotRelevant = noDataMatchRequired || dataIsMatch;

        if (matchingType && matchingDataOrNotRelevant) {
          cleanup();
          resolve(typedMessage as GameStateUpdateOfType<T>);
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Timed out waiting for message of type ${expectedReplyType}, instead got ${JSON.stringify(messages, null, 2)}`
          )
        );
      }, TestClient.MESSAGE_WAIT_TIMEOUT);

      const onClose = () => {
        cleanup();
        reject(new Error("Socket closed before expected message"));
      };

      const cleanup = () => {
        clearTimeout(timer);
        connectionEndpoint.off("message", onMessage);
        connectionEndpoint.off("close", onClose);
      };

      connectionEndpoint.on("message", onMessage);
      connectionEndpoint.once("close", onClose);
    });
  }

  static getTypedMessage(rawData: string) {
    const asString = rawData.toString();
    const asJson = JSON.parse(asString);
    const typedMessage = asJson as GameStateUpdate;
    return typedMessage;
  }

  /** Caches GuestSessionReconnectionToken and Game if successful */
  async connectToGameServer(
    endpointFactory: ClientEndpointFactory,
    connectionInstructions: GameServerConnectionInstructions
  ) {
    const queryParams = {
      name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
      value: connectionInstructions.encryptedSessionClaimToken,
    };

    this.initializeEndpoint(
      endpointFactory.createClientEndpoint(connectionInstructions.url, {
        queryParams: [queryParams],
      })
    );

    const clientJoinedGameServerMessageListener = this.awaitGameStateUpdate(
      GameStateUpdateType.GameFullUpdate
    );

    const reconnectTokenMessageListener = this.awaitGameStateUpdate(
      GameStateUpdateType.CacheGuestSessionReconnectionToken
    );

    await this.connect();

    const reconnectionTokenMessage = await reconnectTokenMessageListener;
    const joinedGameServerMessage = await clientJoinedGameServerMessageListener;

    this.game = joinedGameServerMessage.data.game;
    this.guestReconnectionToken = reconnectionTokenMessage.data.token;

    console.log("set reconnectionToken", this.guestReconnectionToken);

    return { joinedGameServerMessage, reconnectionToken: reconnectionTokenMessage.data.token };
  }

  set game(game: SpeedDungeonGame | null) {
    this._currentGame = game;
  }

  get game(): Readonly<SpeedDungeonGame | null> {
    return this._currentGame;
  }

  set guestReconnectionToken(token: null | GuestSessionReconnectionToken) {
    this._cachedReconnectionToken = token;
  }

  get guestReconnectionToken(): Readonly<GuestSessionReconnectionToken | null> {
    return this._cachedReconnectionToken;
  }
}
