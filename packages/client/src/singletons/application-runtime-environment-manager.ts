import { makeAutoObservable } from "mobx";
import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  InMemoryConnectionEndpointServerRegistry,
  LobbyServer,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import { ClientSingleton, lobbyClientSingleton } from "@/singletons/lobby-client";
// import { GameWorldView } from "@/game-world-view";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import {
  LOCAL_OFFLINE_LOBBY_SERVER_URL,
  createOfflineLocalServers,
} from "@/servers/create-offline-local-servers";
import { AppStore } from "@/mobx-stores/app-store";
import { LobbyClient } from "@/clients/lobby";
// import { GameClient } from "@/clients/game";
import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";
// import { GameClient } from "@/clients/game";

export enum RuntimeMode {
  Initializing,
  Online,
  Offline,
}

export class ApplicationRuntimeEnvironmentManager {
  private _mode = RuntimeMode.Initializing;

  private offlineServers: { lobbyServer: undefined | LobbyServer } = { lobbyServer: undefined };

  constructor(
    private appStore: AppStore,
    private lobbyClientSingleton: ClientSingleton,
    // private gameClientSingleton: ClientSingleton,
    // private gameWorldView: { current: GameWorldView | null },
    private characterAutoFocusManager: CharacterAutoFocusManager
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
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

  get isInitialized() {
    return this.runtimeMode !== RuntimeMode.Initializing;
  }

  enterOnline() {
    this._mode = RuntimeMode.Initializing;
    const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL || "";
    const connectionEndpoint = this.createRemoteEndpoint(remoteLobbyServerAddress, []);
    if (!this.lobbyClientSingleton.isInitialized) {
      this.lobbyClientSingleton.setClient(
        new LobbyClient(
          "Lobby server",
          connectionEndpoint,
          this.appStore,
          gameWorldView,
          this.characterAutoFocusManager,
          RuntimeMode.Online
        )
      );
    } else {
      lobbyClientSingleton.get().setEndpoint(connectionEndpoint);
    }
  }

  enterOffline() {
    this._mode = RuntimeMode.Initializing;

    createOfflineLocalServers().then(({ lobbyServer }) => {
      this.offlineServers.lobbyServer = lobbyServer;

      const connectionEndpoint = InMemoryConnectionEndpointServerRegistry.singleton.connect(
        urlWithQueryParams(LOCAL_OFFLINE_LOBBY_SERVER_URL, /*options?.queryParams ||*/ []),
        {}
      );
      if (!lobbyClientSingleton.isInitialized) {
        lobbyClientSingleton.setClient(
          new LobbyClient(
            "Lobby Server",
            connectionEndpoint,
            this.appStore,
            gameWorldView,
            this.characterAutoFocusManager,
            RuntimeMode.Offline
          )
        );
      } else {
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
    // online
    const connectionEndpoint = this.createRemoteEndpoint(url, queryParams);
    // this.gameClientSingleton.setClient(
    //   new GameClient(
    //     "Game server",
    //     connectionEndpoint,
    //     this.appStore,
    //     gameWorldView,
    //     this.characterAutoFocusManager,
    //     RuntimeMode.Online
    //   )
    // );
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
