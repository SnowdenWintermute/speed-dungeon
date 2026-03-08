import { GameWorldView } from "@/game-world-view";
import {
  AssetCache,
  ClientAppAssetService,
  invariant,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";

export class ClientApplication {
  private assetService: ClientAppAssetService;

  constructor(
    private gameWorldView: null | GameWorldView,
    assetCache: AssetCache
  ) {
    const assetServerUrl = process.env.NEXT_PUBLIC_ASSET_SERVER_URL;
    invariant(assetServerUrl !== undefined, "no asset server url provided");
    const remoteStore = new RemoteServerAssetStore(assetServerUrl);
    this.assetService = new ClientAppAssetService(remoteStore, assetCache, new Map(), () => true);
  }

  // - GameEventLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests
  //   - observable getUserReadable() to show a WoW style "combat log"

  // - MenuState (what menu is open, what page, what is hovered, what character is focused)
  // - MiscState (stuff the frontend jsx will observe)
  //   - Alerts (error/success toast notifications)
  //   - Input state (is alternate mode key held)
  //   - Asset fetch progress observer
  //   - Misc UI Config
  //   - Keybinds config
  //   - Connection status indicator
  //   - Images dynamically created from loaded models (combatant portraits, item thumbnails)
  //
  // - RuntimeEnvironmentManager (change between online/offline mode and manage persistence of choice/error states)
  //   - ConnectionEndpointFactory
  //     - Configured to open runtime dependent Websocket (node or browser version) or InMemoryTransport connections (in offline)
  //   - OfflineGameServer
  //   - OfflineLobbyServer
  //   - LobbyClient
  //     - GameWorldView (optional)
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //     - LobbyState
  //     - SavedCharactersManager
  //   - GameClient
  //     - GameWorldView (optional)
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //     - GameState
  //     - ReplayTreeProcessorManager
}
