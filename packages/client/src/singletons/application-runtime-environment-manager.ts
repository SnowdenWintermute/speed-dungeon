import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
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

export class ApplicationRuntimeEnvironmentManager {
  private _mode = RuntimeMode.Initializing;
  gameWorldView: { current: GameWorldView | null };

  private offlineServers: { lobbyServer: undefined | LobbyServer } = { lobbyServer: undefined };

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
    // makeObservable({
    //   isOnline: computed,
    //   isOffline: computed,
    //   canEnterOffline: computed,
    //   enterOffline: action,
    //   enterOnline: action,
    // });
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

  resetLobbyConnection() {
    console.log("not yet implemented");
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
    console.log("trying to enter online");
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
    console.log("creating game client with url:", url);
    // online
    const connectionEndpoint = this.createRemoteEndpoint(url, queryParams);
    console.log("setting game client with game world:", this.gameWorldView.current);
    this.gameClientSingleton.setClient(
      new GameClient(
        "Game server",
        connectionEndpoint,
        this.appStore,
        this.gameWorldView,
        this.characterAutoFocusManager,
        RuntimeMode.Online
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
