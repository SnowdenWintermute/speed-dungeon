// on auth user connection to lobby
// disconnect all other connections for this user in the lobby (send their client to offline mode with explaining message)
// if InitialConnectionPending, any tab that loads in will be forwarded to game server
// if AwaitingReconnection, any tab that loads in will be forwarded to game server
// if InGame
// - Read the info from the GlobalAuthSession and issue a GameServerSessionClaimToken for the recently connected user
// - They present that to the GameServer
// - GameServer disconnects existing connection for that userId
//   . disconnect handler, not leave game handler
//   . this will start a ReconnectionOpportunity which should be instantly claimed by
//     the newly connecting user
// - sends disconnected client to "offline mode" with explaining message
// - GameServer attaches new connection to the player's characters (like in a reconnection)
// - GameServer clears and pending reconnection opportunity if any
//
