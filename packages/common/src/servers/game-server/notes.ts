// on game server spin-up
// - reports readiness status to something that lobby can query
//   - third party library like Agones
//   - in-memory game server fleet manager (for offline single player, only ever makes one local game server)
//
// on all players in lobby game ready to start game
// - getLeastBusyGameServerOrProvisionOne()
// - await write PendingGameSetup to a central store in a Record<GameId, PendingGameSetup> (valkey or in-memory)
//   - PendingGameSetup has a TTL that will somehow get it cleaned up if no game server tries to claim it
//   - PendingGameSetup includes SpeedDungeonGame and a Map<Username, UserId> so when users present their
//     tokens GameServer can create a session for them by UserId without exposing UserId to the client in the token
// - lobby sends to users
//    - URL of game server
// - lobby issues opaque encrypted GameServerSessionClaimToken to users which include
//    - PendingGameSetup game ID
//    - Username to attach to the corresponding Player in the PendingGameSetup
//    - Expiry
//    - Nonce     const nonce = crypto.randomBytes(16).toString("hex");
// - clients use the URL open connections to the GameServer and present their tokens in the handshake

// when the game server receives incoming connection from a user
// - checks their handshake for a GameServerSessionClaimToken
// - decrypts and validates the token
// - if no game exists on the server by the id in the GameServerSessionClaimToken
//   - check the central store for a PendingGameSetup by that id
//   - create the Game from the PendingGameSetup
//   - delete the PendingGameSetup record from the central store
//   - write an ActiveGame record to the central store in a Record<GameId, ActiveGame>
//     so the lobby can check if this game still exists when a user reconnects to the lobby
//     after disconnection from the game server
// - create the UserSession and assign it to the user's connection
// - place the UserSession in the Game
// - if all Players in Game have a corresponding expected UserSession
//   - if the game has not yet started
//     - handle any game mode specific onStart business
//     - start accepting player inputs
//     - start a heartbeat loop to periodically update the ActiveGame record's lastHeartbeatTimestamp
//       in the central store
//   - if the game was in progress
//     - this was a reconnection for a disconnected user
//     - delete the disconnection session from the central store
//     - unpause acceptance of player inputs

//
// handle disconnection
// - clean up the user's session, but hold a reference for potential reconnection
// - if the user was a member of a dead party, just let them DC without any reconnection method
// - if there are no living parties in the game, clean up the game
// otherwise, allow for reconnection
// -  create a DisconnectedSession from the user's session
// - write the DisconnectedSession to a shared store (valkey or in-memory) as a Record<UserId, DisconnectedSession>
// - pause acceptance of user inputs until reconnection is established or a timeout has passed
//   - on timeout or reconnection, delete the entry in the Record<UserId, DisconnectedSession>
//
// handle a reconnection (to lobby server after disconnection from game server)
// - guests provide GuestId (UUID) from their local storage
// - if authenticated user, lobby server gets their UserId from lobby's auth service
// - lobby checks the central store for a DisconnectedSession for that GuestId or UserId
// - lobby ensures the game associated with this disconnected session is still active
//   by checking the central store's Record<GameId, ActiveGame>
// - lobby provides a GameServerSessionClaimToken to user client
// - user client executes normal flow for onGameServerSessionClaimTokenReceipt, same as when they
//   are in a lobby game setup and start a new game
//
//   game server's heartbeat loop
//   - update all corresponding ActiveGameStatus objects in the central store
//
// lobby's DanglingResourcesCleanupLoop
// - read all ActiveGame records from the central store and check their last lastHeartbeatTimestamp
// - if expired, clean up any dangling records in the central store:
//   - PendingGameSetup
//   - ActiveGame
//   - DisconnectedSession
//
// on lobby server crash
// - have the containing node auto-restart the process
//
