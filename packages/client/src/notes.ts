// FrontendApp (served from remote or from cached in a service worker)
//
// - LobbyState (a replication of the lobby server state)
// - GameState (a replication of the game server game state)
// - GameWorldView (babylonjs world)
// - MenuState (what menu is open, what page, what is hovered, what character is focused)
//
// - AssetCache (abstracted to allow different caching strategies, on browser uses IndexedDB)
// - AssetService
//   - handles all frontend calls to getting assets
//   - either serves from cache or fetches from remote
//   - starts prefetching all assets on app load
// - OfflineGameServer (same class that a GameServerNode uses to process client inputs)
// - Websocket or InMemoryTransport (provided to XClients)
//
// - GameClient/LobbyClient
//   - Receives a transport configured by the FrontendApp
//   - Registers listeners/message handlers
//   - exposes configured transport to NextjsViews for sending messages
//
// - NextjsViews
//   - Controlled by/displays the MenuState and GameState
//   - Also can have local state (useStates)
//   - Dispatches messages to LobbyClient and GameClient
//
// startup (online)
// - try open websocket connection to lobby server
// - if fails, create local lobby server and in memory connection endpoint
// - create a LobbyClient with whatever endpoint we created
// - open websocket connection to lobby server
// - start updating AssetCache in the background
//
// on join game server instructions received
// - create a GameClient
// - open websocket connection to game server
