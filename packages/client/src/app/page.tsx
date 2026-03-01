// @refresh reset
"use client";
import { Lobby } from "./lobby";
import { enableMapSet } from "immer";
import { GameSetup } from "./lobby/game-setup";
import AlertManager from "./components/alerts/AlertManager";
import { Game } from "./game";
import TailwindClassLoader from "./TailwindClassLoader";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import { TooltipManager } from "./TooltipManager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import SceneManager, { gameWorldView } from "./game-world-view-canvas/SceneManager";
import { BrowserWebSocketConnectionEndpoint, ConnectionId } from "@speed-dungeon/common";
import { LobbyClient } from "@/clients/lobby";
import { lobbyClientSingleton } from "@/singletons/lobby-client";
import { useEffect } from "react";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import AssetManager from "./asset-manager";

// for immer to be able to use map and set
enableMapSet();

// const offlineServers: { lobbyServer: undefined | LobbyServer } = { lobbyServer: undefined };

export default observer(() => {
  const game = AppStore.get().gameStore.getGameOption();
  const focusedCharacterOption = AppStore.get().gameStore.getFocusedCharacterOption();

  const shouldShowGame = focusedCharacterOption !== undefined && game?.getTimeStarted();

  useEffect(() => {
    // offline
    // createOfflineLocalServers().then(({ lobbyServer }) => {
    //   offlineServers.lobbyServer = lobbyServer;

    //   const connectionEndpoint = InMemoryConnectionEndpointServerRegistry.singleton.connect(
    //     urlWithQueryParams(LOCAL_OFFLINE_LOBBY_SERVER_URL, /*options?.queryParams ||*/ []),
    //     {}
    //   );
    //   if (!lobbyClientSingleton.isInitialized) {
    //     lobbyClientSingleton.setClient(
    //       new LobbyClient(connectionEndpoint, AppStore.get(), gameWorldView)
    //     );
    //   } else {
    //     lobbyClientSingleton.get().setEndpoint(connectionEndpoint);
    //   }
    // });

    // online

    const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;
    const ws = new WebSocket(remoteLobbyServerAddress || "");
    const connectionEndpoint = new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
    if (!lobbyClientSingleton.isInitialized) {
      lobbyClientSingleton.setClient(
        new LobbyClient(
          "Lobby server",
          connectionEndpoint,
          AppStore.get(),
          gameWorldView,
          characterAutoFocusManager
        )
      );
    } else {
      lobbyClientSingleton.get().setEndpoint(connectionEndpoint);
    }
  }, []);

  const componentToRender = shouldShowGame ? (
    <Game />
  ) : game ? (
    <GameSetup gameMode={game.mode} />
  ) : (
    <Lobby />
  );

  return (
    <>
      <AssetManager />
      <TailwindClassLoader />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>{componentToRender}</SkyColorProvider>
    </>
  );
});
