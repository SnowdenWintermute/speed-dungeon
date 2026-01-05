// on game server spin-up
// - has hardcoded lobby address
// - opens connection with lobby and provides some secret credentials
// - lobby's connection handler
//
// handle a handoff from Lobby to GameServer
// - checks existing GameServers for the one with the lowest load
// - adds a local record of the game server in the local game server node registry under it's corresponding node
// - sends Game to GameServerNode
// - sends Record<ClaimId, PendingSession> to GameServer
// - pending session should expire same time as SessionClaim token expires
// - if no session is claimed within the time window, close the game
// - stores claim tokens for players and waits for game server to say it is ready
//
//  handle "game ready to receive players" message from game server to lobby
// find a staged outbox for this game name
// - sends GameServerAddress to Players
// - sends GameServerSessionClaimToken to Players
// - sends GameServerAddress to Players
// - sends GameServerSessionClaimToken to Players
//
// handle connection
// - player opens connection with GameServer and presents SessionClaimToken
// - GameServer validates presented token's signature
// - GameServer checks the presented ClaimId against its list of PendingSessions
// - GameServer creates a UserSession linking the player's ConnectionId to an object which
//   knows user's UserId(Guest or Auth) and which player and characters
//   they are permitted to control in the game
//
// handle all players initially connected
// - handle game mode specific onStart business
// - trigger the game simulator's "next room exploration" handler to automatically
//   put parties in their first room of the dungeon
//
//
// handle disconnection
// - delete the user's session and create a DisconnectedSession from its data
// - pause acceptance of user inputs until reconnection is established or a timeout has passed
// - tell the lobby server that a user in this game has disconnected with their session's associated UserId or GuestId
// - lobby records in a Map<UserId,DisconnectedSession> or Map<GuestId, DisconnectedSession>
// - lobby has a disconnected sessions cleanup loop to delete any expired disconnected sessions
//
// handle a reconnection
// - guests provide GuestId (UUID) from their local storage
// - if authenticated user, lobby server gets their UserId from lobby's auth service
// - lobby checks disconnected session lists for that GuestId or UserId
// - lobby ensures the game associated with this disconnected session is still active
// - lobby tells game server to create a new PendingReconnectionSession with new SessionClaimId
// - game server checks its DisconnectedSession list for matching
// - lobby provides a new GameServerSessionClaimToken with new SessionClaimId and GameServerAddress to client
// - client connects to the GameServerAddress with their new GameServerSessionClaimToken
// - GameServer unpauses input acceptance
//
// GameServer
// - heartbeats to Lobby so the lobby can keep record of active games for reconnection
// - missed heartbeats cause "stale" status but don't delete game record yet
// - several missed heartbeats delete the game record in the lobby
// - after no input from any player for a long time, shut down the game server
//
// Tokens
// - must be single use
// - must expire
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
