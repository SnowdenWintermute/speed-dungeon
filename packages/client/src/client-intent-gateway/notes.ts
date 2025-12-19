// ClientIntentGateway
// - accepts player inputs that must be submitted to
//   something beyond the boundary of the local state's authority
// - parameterized with an intent handler on creation such as a WebsocketConnection
//   or LocalClientIntentSender
// - delegates intents to the handler which may send them to a listening ClientIntentReceiver
//   which may be owned by either a GameServer, a LobbyServer or the ClientApp's local LobbyManager
//   and GameSimulatorManager
//
// ClientIntentReceiver
// - parameterized with a listener such as a WebsocketConnection or LocalClientIntentReceiver
// - sets up handler methods on various ClientIntent types like
//   this.listener.on("eventType", [ middleware1, middleware2 ], handler)
//
// GameSimulatorUpdateGateway
// - provides api for call sites in the game simulation code
// for sending authoritative updates to clients like GameSimulatorUpdateGateway.send("eventType", data)
// - is parameterized with a handler like a WebsocketConnection or a LocalGameServerUpdateHandler
//
// GameSimulatorUpdateReceiver
// - listens for updates from a GameSimulator via a parameterized GameSimulatorUpdateListener
// - delegates updates to handlers to update the client's GameState
//
// LobbyUpdateReceiver
// - client's listener to updates about client's LobbyState
// - parameterized with an IntentSender
//
// LobbyUpdateGateway
// - Lobby's way to send out updates to clients
// - Parameterized with
//
//
// Lobby
// - lives either inside a LobbyServer or locally on a ClientApp
// - owns a ClientIntentReceiver, parameterized with a ClientIntentListener
// - handles events from ClientIntentReceiver
//
// - holds a LobbyState
//   - list of players in the lobby
//   - list of all games either on GameServers or just the local game
//
// - handles game setup and pre-game configuration
// - hands off set up games to a GameSimulator which could be local on the ClientApp,
//   inside a GameServer running in a local container on the same VPS, or on a GameServer
//   in another data center
// - parameterized with a GameSimulatorHandoffStrategy
// - gives client a GameSimulatorConnectionInstructions
//   like a token and an address to a game server or an instruction
//   to create a local GameSimulator and configure their ClientIntentGateway to
//   send intents there
//
// - communicates with some GameServerProvisioner if load is high on existing GameServers
//   to spin up another one if needed
//
// GameSimulator
// - holds a GameState
// - accepts player input via a ClientIntentReceiver
// - processes inputs and updates the authoritative GameState
// - creates and sends game updates via a GameSimulatorUpdateGateway
// - lives inside either a GameServer or a GameClient which configures
//   the GameSimulatorUpdateGateway accordingly
//
// GameServer
// - holds one or more GameSimulator
// - holds list of players connected and which GameSimulator they
// are a member of
// - provides the GameSimulator's GameSimulatorUpdateGateway with a WebsocketConnection
//
// ClientApp
// - accessed either by visiting the website or downloading the Electron app or similar wrapper
// - manages a local UI state
// - manages the 3d presentation world
// - provides the ClientIntentGateway with a handler, either a LocalClientIntentSender
// or a WebsocketConnection
// - provides the GameSimulatorUpdateReceiver with a handler to either listen to a WebsocketConnection
// or to a LocalGameServerUpdateHandler
// - processes GameUpdates and LobbyUpdates to synchronize the ClientApp's local LobbyState
// and GameState either instantly or with ReplayTrees as handled by the GameSimulatorUpdateReceiver
//
