import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  GameServer,
  InMemoryConnectionEndpointServerRegistry,
  LobbyServer,
  runIfInBrowser,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ClientApplication } from "..";
import { ConnectionStatus } from "../ui/connection-status";
import { LobbyClient } from "../clients/lobby";
import {
  LOCAL_OFFLINE_LOBBY_SERVER_URL,
  createOfflineLocalServers,
} from "./create-offline-servers";
import { GameClient } from "../clients/game";

export enum ConnectionMode {
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

export class ConnectionTopology {
  private _mode = ConnectionMode.Initializing;
  private preferredMode = ConnectionMode.Online;

  private offlineServers: {
    lobbyServer: undefined | LobbyServer;
    gameServer: GameServer | undefined;
  } = {
    lobbyServer: undefined,
    gameServer: undefined,
  };

  constructor(private clientApplication: ClientApplication) {
    runIfInBrowser(() => {
      makeAutoObservable(this, {}, { autoBind: true });
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
    return this.runtimeMode !== ConnectionMode.Initializing;
  }
  get canEnterOffline() {
    const { assetFetchProgress } = this.clientApplication.uiStore;
    const { initialized, isComplete } = assetFetchProgress;
    return initialized && isComplete;
  }
  set runtimeMode(mode: ConnectionMode) {
    this._mode = mode;
  }
  get runtimeMode() {
    return this._mode;
  }
  get isOnline() {
    return this._mode === ConnectionMode.Online;
  }
  get isOffline() {
    return this._mode === ConnectionMode.Offline;
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

  enterOnline(lobbyServerUrl: string) {
    return new Promise<void>((resolve, reject) => {
      this._mode = ConnectionMode.Initializing;
      const { connectionStatus } = this.clientApplication.uiStore;
      const { lobbyClientRef, gameClientRef } = this.clientApplication;
      connectionStatus.connectionStatus = ConnectionStatus.Initializing;
      const remoteLobbyServerAddress = lobbyServerUrl;
      const connectionEndpoint = this.createRemoteEndpoint(remoteLobbyServerAddress, []);
      connectionEndpoint.on("open", () => {
        resolve();
      });
      if (!lobbyClientRef.isInitialized) {
        lobbyClientRef.setClient(
          new LobbyClient(
            "Lobby server",
            connectionEndpoint,
            this.clientApplication,
            this,
            ConnectionMode.Online
          )
        );
      } else {
        lobbyClientRef.get().targetConnectionMode = ConnectionMode.Online;
        lobbyClientRef.get().setEndpoint(connectionEndpoint);
      }
    });
  }

  enterOffline() {
    this._mode = ConnectionMode.Initializing;
    const { connectionStatus } = this.clientApplication.uiStore;
    const { lobbyClientRef, gameClientRef } = this.clientApplication;
    connectionStatus.connectionStatus = ConnectionStatus.Initializing;

    createOfflineLocalServers(this.clientApplication.assetService).then(
      ({ lobbyServer, gameServer }) => {
        this.offlineServers.lobbyServer = lobbyServer;
        this.offlineServers.gameServer = gameServer;

        const connectionEndpoint = this.createLocalConnectionEndpoint(
          LOCAL_OFFLINE_LOBBY_SERVER_URL,
          []
        );
        if (!lobbyClientRef.isInitialized) {
          lobbyClientRef.setClient(
            new LobbyClient(
              "Lobby Server",
              connectionEndpoint,
              this.clientApplication,
              this,
              ConnectionMode.Offline
            )
          );
        } else {
          lobbyClientRef.get().targetConnectionMode = ConnectionMode.Offline;
          lobbyClientRef.get().setEndpoint(connectionEndpoint);
        }
      }
    );
  }

  createGameClient(
    url: string,
    queryParams: {
      name: string;
      value: string;
    }[]
  ) {
    const connectionEndpoint = this.createModeConnectionEndpoint(url, queryParams);
    this.clientApplication.gameClientRef.setClient(
      new GameClient(
        "Game server",
        connectionEndpoint,
        this.clientApplication,
        this,
        this.runtimeMode
      )
    );
  }
}
