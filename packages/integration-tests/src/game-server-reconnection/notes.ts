// reconnect midway through action replay that resolves in party victory
// - shows "resolving replay in progress"
// - unlocks input after timeout
// - shows loot on ground
// - other players can loot the items (acknoweldge receipt of item on ground fires)
//
// reconnect midway through action replay that resolves in party wipe
// - shows "resolving replay in progress"
// - unlocks input after timeout
// - shows party wiped screen
//
//
// create new game with cached expired token don't send bunch of error messages
//
// reconnect connect even if all players disconnected, at least one unintentionally
// don't reconnect if leave game intentionally
// if last player leaving
// - remove game server game
// - remove server side valkey(or shared store) game record
// - remove lobby forwarding records
//
// can make game of previously existing game name if all players intentionally left it
// can make game of previously existing game name if it timed out all reconnection opportunities
//
//
// after login to auth, don't try to use guest reconnection token anymore (and clear it)
//

// AUTH
// connect after timeout
//
// reconnect success
// reconnect after all players disconnected or left
// no reconnect if leave game intentionally

//
//
// DONE
// guest reconnect token reuse
// guest reconnect after timeout
// guest reconnect success
//
// session claim token required
// invalid session claim token
// session claim token reuse
//
// input before game start
// input while awaiting reconnect
// input after reconnect
// input after reconnect timeout
//
// reconnect midway through action replay
// - shows "resolving replay in progress"
// - unlocks input after timeout
// - can execute input
