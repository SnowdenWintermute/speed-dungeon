// Difference guests/auth
// - guests can not own saved characters or participate in games that require them
// - guests have ephemeral per-connection identity and can only reconnect by presenting
// a token given to them by the game server on joining that they save
// - auth user reconnection is managed by recognizing the user by their IdentityProviderId
//
// GlobalSessionGameStatus status field could hold: (when creating, error if exist already)
// - initial connection pending
// - in game
// - reconnection available
//
// on game handoff
// - auth user
//   . mark global session status as "connection instructions issued"
// - guest user
//   . just give them their connection instructions
//   . if they lose them, they won't join the game and that game will never start
//   . other users in the game will have to leave game once they become impatient
//
//
// on game server connection
// - all users
//   . parse connection context (initial or reconnection)
// - guest user
//   . give them a reconnection token to save locally and present to lobby on reconnection
// - auth user
//   . mark global session status as "in game"
//
// on game server disconnection
// - auth user
//   . save a reconnection opportunity on their global session status
//   . start a timeout to clean up the opportunity if not used
// - guest user
//   . save a reconnection opportunity in a GuestReconnectionForwardingStore
//   . start a timeout to clean up the opportunity if not used
//
// on leave game/reconnection timeout (auth user)
// - delete their GlobalSession status
//
// on join lobby
// - auth user
//   . check their global auth session for reconnection/connection instructions
//   . if reconnection, give them new connection instructions
//   (don't save them in global session because they can always get more while
//   the reconnection opportunity is live)
//   . if initial connection pending, re-issue connection instructions
// - guest user (guests present a reconnection token they save locally on their device)
//   . check the guest reconnection forwarding store for an opportunity and
//   . if exists, provide connection instructions
//
//
//
// lobby dangling resources loop
// for any expired active game records
// - delete reconnection opportunities
// - delete active game records
// - check auth global sessions for being in that game (by game's UUID) and delete them
// for any expired pending games
// - delete pending game setups
// - delete unused connection instructions stored on global sessions
// - check auth global sessions for connection instructions for that game (by game's UUID) and delete them
//
//
// TEST
// - reconnection by a user in a game that has been initialized but
// not all users have connected yet
