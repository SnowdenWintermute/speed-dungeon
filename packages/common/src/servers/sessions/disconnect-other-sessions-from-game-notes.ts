// TRANSFER CONTROL TO MOST RECENT CONNECTION FEATURE:
// disconnect all other connections for this user in the lobby
// if InitialConnectionPending, any tab that loads in will be forwarded to game server
// if AwaitingReconnection, any tab that loads in will be forwarded to game server
// if InGame
// - Create an "AssumeControl" credential for the recently connected user
// - They present that to the GameServer
// - GameServer disconnects existing connection for that userId
// - sends disconnected client to "offline mode" with explaining message
// - GameServer attaches new connection to the player's characters (like in a reconnection)
// - GameServer clears and pending reconnection opportunity if any
//
// DELETE ME FROM OTHER GAMES FEATURE:
// GlobalAuthSession marked as InitialConnectionPending
// Session A has a GameServerSessionClaimToken
// Session B calls leaveGameAllSessions
// Lobby reads game server name from GlobalAuthSession
// Lobby sends message to game server with command to remove that user's player from game
// RACE: player could connect in this moment
// GameServer removes player if they exist, blacklists them and cleans up any ReconnectionOpportunity
// RACE: player could connect in this moment
// GameServer deletes the GlobalAuthSession from the store
// LobbyServer awaits polling deletion of GlobalAuthSession to show confirmation
//
//
// GlobalAuthSession marked as InGame
// Session A should be connected to game server
// Session B calls leaveGameAllSessions
// RACE: Session A disconnects and becomes InitialConnectionPending
// Lobby reads game server name from GlobalAuthSession
// Lobby sends message to game server with command to remove that user's player from game
// GameServer removes player if they exist, blacklists them and cleans up any ReconnectionOpportunity
// GameServer deletes the GlobalAuthSession from the store
// LobbyServer awaits polling deletion of GlobalAuthSession to show confirmation
//
//
// GlobalAuthSession marked as AwaitingReconnection
// Session A may or may not be connected to lobby
// Session A has a live ReconnectionOpportunity
// Session B calls leaveGameAllSessions
// Lobby deletes the ReconnectionOpportunity from the store
// Lobby reads game server name from GlobalAuthSession
// Lobby sends message to game server with command to remove that user's player from game
// GameServer removes player if they exist, blacklists them and cleans up any ReconnectionOpportunity
// GameServer deletes the GlobalAuthSession from the store
// LobbyServer awaits polling deletion of GlobalAuthSession to show confirmation
//
// on game cleanup, delete the blacklist entries for that game id
//
