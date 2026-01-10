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
// - lobby issues signed GameServerSessionClaimToken to users which include
//    - URL of game server
//    - PendingGameSetup game ID
//    - Username to attach to the corresponding Player in the PendingGameSetup
//    - Expiry
//    - Nonce     const nonce = crypto.randomBytes(16).toString("hex");
// - clients use the URL in the token to open connections to the GameServer and present their tokens in the handshake
//
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
//     - unpause acceptance of player inputs

//
// handle disconnection
// - delete the user's session and create a DisconnectedSession from its data
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
// interface GameServerSessionClaimToken {
//   readonly gameId: string; // UUID
//   readonly sessionClaimId: string; // UUID
//   // newly generate guest username or current auth username. Including this ensures that if a user
//   // changed their username or were assigned a different guest username in between disconnecting and
//   // reconnecting that they will show as the correct name in the game
//   readonly username: string;
//   readonly expiresAt: number;
//   readonly signature: string; // HMAC or asymmetric signature
// }

// interface DisconnectedSession {
//   readonly gameId: string; // UUID
//   // if both guestId and userId are null, this is invalid
//   readonly userId: null | IdentityProviderId; // UUID
//   readonly guestId: null | string; // UUID
//   readonly expiresAt: number;
//   readonly signature: string; // asymmetric signature, lobby holds private key, game servers hold public key
// }
