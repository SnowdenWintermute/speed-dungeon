// on auth user connection to lobby
// disconnect all other connections for this user in the lobby (send their client to offline mode with explaining message)
// if a GlobalUserSession exists for this id
// - Read the info from the GlobalUserSession and issue a GameServerSessionClaimToken for the recently connected user
// - They present that to the GameServer
//
// on guest user connection to lobby
// if no GuestReconnectionToken, connect as normal
// else, look up their GlobalUserSession by decrypting the saved GuestUserId from their reconnection token
// if no GlobalUserSession matches their token, token is considered expired - connect as normal
// expect to find "AwaitingReconnection", the only valid state for a Guest's GlobalUserSession on new lobby connection
// if state is otherwise, connect as fresh guest
//  - (we don't handle guests that fail their initial connection because they have no way to prove their identity until the
//  game server gives them a reconnection token)
//  - it is possible a guest user opens another tab, uses LocalStorage saved reconnection token while they are still in game
//    so they would see GlobalUserSession as "InGame" so we should ignore the token in that case
// Read the info from the GlobalUserSession and issue a GameServerSessionClaimToken
// They present that to the GameServer
//
// on game server connection
// if no live session exists for this id and game is started
// - check that a reconnection opportunity exists for this id
// - if yes, delete the reconnection opportunity and connect them
// if no live session exists for this id and game is pending or awaiting start
// - create their session
// - start game if all players are here
// else if NOT GUEST and live session exists for this id and game is started
// - GameServer disconnects existing connection for that userId
//   . disconnect handler with "don't reconnect" flag
// - sends disconnected client to "offline mode" with explaining message
// - GameServer calls attachNewConnectionToExistingSession()
// - GameServer clears any pending reconnection opportunity if any
