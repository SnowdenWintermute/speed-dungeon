// after login to auth, don't try to use guest reconnection token anymore (and clear it)
//

//
//
// DONE
// reconnect token reuse
// reconnect after timeout
// reconnect success
// reconnect after all players disconnected or left
// no reconnect if leave game intentionally
// connect after timeout
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
// reconnect midway through action replay that resolves in party victory
// reconnect midway through action replay that resolves in party wipe
//
// reconnect connect even if all players disconnected
//
// intentional game leaving vs disconnecting
// can make game of previously existing game name if all players intentionally left it
// can make game of previously existing game name if it timed out all reconnection opportunities
//
// DEFERRED
//
// create new game with cached expired token don't send bunch of error messages(I think this had to do with the QUICK JOIN button firing its events without being asked)
