// FrontendApp
// - LobbyState
// - GameState
// - GameWorldView
// - MenuState
//
// - AssetCache
// - OfflineGameServer
// - Websocket or InMemoryTransport
//
// - LobbyClient
// - GameClient
//
// startup (online)
// - create a LobbyServerClient
// - open websocket connection to lobby server
// - start updating AssetCache in the background
//
// on join game instructions received
// - create a GameClient
// - open websocket connection to game server
