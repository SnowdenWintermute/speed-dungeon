// SAVED CHARACTERS
// can not delete a saved character if auth account is in a game
// PROGRESSION GAME
// can not join another progression game while already in one on same account
//
// TURN ORDER
// turn order bar updates on turn end
// turn order bar shows conditions when tickable condition cast
//
// THREAT
// threat decay ticks down visibly
// threat added when monster hit
// threat added to all monsters when ally healed
//
// ITEM MANAGEMENT
// items can be picked up and dropped
// races between clients trying to pick up same item
// shards picked up and dropped
//
// CHARACTER PROGRESSION
// allocate attribute points
// allocate ability points
// attribute points affect derrived attributes and resources
//
// VENDING MACHINE
// operate vending machine
//
// LOBBY GAME SETUP
// guest create unranked race
// guest can't create ranked or progression
// race game create party
// race game create character
// auth user create progression game
// get game list shows created games
// users see other player create party, character
//
// -------------------------
// --- DONE AND DEFERRED ---
// -------------------------
//
// LADDER RANKINGS - DONE
// on ladder death, other players see death message
// on ladder rank up, other players see message
//
// LADDER RANKINGS - DEFERRED
// on ladder death/rank change, ladder page request shows correct rankings
//
// PROGRESSION GAMES - DONE
// can not select starting floor higher than the highest starting floor reached by any selected character
// selecting characters with higher floor levels allows changing to higher starting floor
// - selecting away from character that previously allowed a higher starting floor changes the
//   selected floor to the new max
// can select characters in progression game
// other user sees character being selected
// other user sees default character of other player when they join
// only auth user can create game
// can not create game without a saved character
// if error out of creating a game, can go create a saved character and then create a game
// can not create game if in another game on same session
// only auth user can join game
// can not join game without a saved character
//
// PROGRESSION GAMES - DEFERRED
// can not select dead characters in progression game
//
// GAME SERVER RECONNECTION - DONE
// reconnect token reuse
// reconnect after timeout
// reconnect success
// reconnect after all players disconnected or left
// no reconnect if leave game intentionally
// connect after timeout
// after login to auth, don't try to use guest reconnection token anymore (and clear it)
// session claim token required
// invalid session claim token
// session claim token reuse
// input before game start
// input while awaiting reconnect
// input after reconnect
// input after reconnect timeout
// reconnect midway through action replay
// reconnect midway through action replay that resolves in party victory
// reconnect midway through action replay that resolves in party wipe
// reconnect connect even if all players disconnected
// intentional game leaving vs disconnecting
// can make game of previously existing game name if all players intentionally left it
// can make game of previously existing game name if it timed out all reconnection opportunities
//
// GAME SERVER RECONNECTION - DEFERRED
// create new game with cached expired token don't send bunch of error messages(I think this had to do with the QUICK JOIN button firing its events without being asked)
