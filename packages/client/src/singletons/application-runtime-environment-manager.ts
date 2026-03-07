import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  GameServer,
  InMemoryConnectionEndpointServerRegistry,
  LobbyServer,
  runIfInBrowser,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import { ClientSingleton, lobbyClientSingleton } from "@/singletons/lobby-client";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import {
  LOCAL_OFFLINE_LOBBY_SERVER_URL,
  createOfflineLocalServers,
} from "@/servers/create-offline-local-servers";
import { AppStore } from "@/mobx-stores/app-store";
import { LobbyClient } from "@/clients/lobby";
import { GameWorldView } from "@/game-world-view";
import { GameClient } from "@/clients/game";
import { ConnectionStatus } from "@/mobx-stores/connection-status";
import { makeAutoObservable } from "mobx";

export enum RuntimeMode {
  Initializing,
  Online,
  Offline,
}

// @TODO
// - save preferredMode in abstract persistent device storage
// - default to preferredMode on app startup
// - default to preferredMode new lobby connection on leaving game
// - fallback to offline if connection fails to online
// - fallback to online if offline has incomplete assets cached
// - fallback to error state if neither offline nor online modes are valid
// - cache last asset manifest
// - on start in offline mode, check cached asset manifest

export class ApplicationRuntimeEnvironmentManager {
  private _mode = RuntimeMode.Initializing;
  private preferredMode = RuntimeMode.Online;
  gameWorldView: { current: GameWorldView | null };

  private offlineServers: {
    lobbyServer: undefined | LobbyServer;
    gameServer: GameServer | undefined;
  } = {
    lobbyServer: undefined,
    gameServer: undefined,
  };

  constructor(
    private appStore: AppStore,
    private lobbyClientSingleton: ClientSingleton,
    private gameClientSingleton: ClientSingleton,
    gameWorldView: { current: GameWorldView | null },
    private characterAutoFocusManager: CharacterAutoFocusManager
  ) {
    this.gameWorldView = gameWorldView;
    runIfInBrowser(() => {
      makeAutoObservable(this, { gameWorldView: false }, { autoBind: true });
    });
  }

  private createRemoteEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    const ws = new WebSocket(urlWithQueryParams(url, queryParams));
    return new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
  }

  private createLocalConnectionEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    return InMemoryConnectionEndpointServerRegistry.singleton.connect(
      urlWithQueryParams(url, queryParams),
      {}
    );
  }

  private createModeConnectionEndpoint(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    if (this.isOnline) {
      return this.createRemoteEndpoint(url, queryParams);
    } else if (this.isOffline) {
      return this.createLocalConnectionEndpoint(url, queryParams);
    } else {
      throw new Error(
        "Expected to only try creating a connection endpoint when runtime mode is initialized"
      );
    }
  }

  get isInitialized() {
    return this.runtimeMode !== RuntimeMode.Initializing;
  }

  resetLobbyConnection() {
    // this.connectionEndpoint.close();
    // this.appStore.connectionStatusStore.connectionStatus = ConnectionStatus.Initializing;
    // const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;
    // // TODO - polymorphic runtime mode based reconnection
    // getApplicationRuntimeManager().
    // const ws = new WebSocket(remoteLobbyServerAddress || "");
    // const connectionEndpoint = new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
    // try {
    //   this.setEndpoint(connectionEndpoint);
    // } catch {
    //   return;
    // }
  }

  enterOnline() {
    this._mode = RuntimeMode.Initializing;
    this.appStore.connectionStatusStore.connectionStatus = ConnectionStatus.Initializing;
    const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL || "";
    const connectionEndpoint = this.createRemoteEndpoint(remoteLobbyServerAddress, []);
    if (!this.lobbyClientSingleton.isInitialized) {
      this.lobbyClientSingleton.setClient(
        new LobbyClient(
          "Lobby server",
          connectionEndpoint,
          this.appStore,
          this.gameWorldView,
          this.characterAutoFocusManager,
          RuntimeMode.Online
        )
      );
    } else {
      lobbyClientSingleton.get().targetRuntimeMode = RuntimeMode.Online;
      lobbyClientSingleton.get().setEndpoint(connectionEndpoint);
    }
  }

  enterOffline() {
    this._mode = RuntimeMode.Initializing;
    this.appStore.connectionStatusStore.connectionStatus = ConnectionStatus.Initializing;

    createOfflineLocalServers().then(({ lobbyServer, gameServer }) => {
      this.offlineServers.lobbyServer = lobbyServer;
      this.offlineServers.gameServer = gameServer;

      const connectionEndpoint = this.createLocalConnectionEndpoint(
        LOCAL_OFFLINE_LOBBY_SERVER_URL,
        []
      );
      if (!lobbyClientSingleton.isInitialized) {
        lobbyClientSingleton.setClient(
          new LobbyClient(
            "Lobby Server",
            connectionEndpoint,
            this.appStore,
            this.gameWorldView,
            this.characterAutoFocusManager,
            RuntimeMode.Offline
          )
        );
      } else {
        lobbyClientSingleton.get().targetRuntimeMode = RuntimeMode.Offline;
        lobbyClientSingleton.get().setEndpoint(connectionEndpoint);
      }
    });

    // create local lobby server
    // create local game server
    // create polymorphic strategy handler for connection actions
    // - if online, use websocket
    // - if offline, use in memory transport to local lobby or game server
  }

  createGameClient(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    const connectionEndpoint = this.createModeConnectionEndpoint(url, queryParams);
    this.gameClientSingleton.setClient(
      new GameClient(
        "Game server",
        connectionEndpoint,
        this.appStore,
        this.gameWorldView,
        this.characterAutoFocusManager,
        this.runtimeMode
      )
    );
  }

  get canEnterOffline() {
    const { assetFetchProgressStore } = this.appStore;
    const { initialized, isComplete } = assetFetchProgressStore;
    return initialized && isComplete;
  }

  set runtimeMode(mode: RuntimeMode) {
    this._mode = mode;
  }

  get runtimeMode() {
    return this._mode;
  }

  get isOnline() {
    return this._mode === RuntimeMode.Online;
  }

  get isOffline() {
    return this._mode === RuntimeMode.Offline;
  }
}
