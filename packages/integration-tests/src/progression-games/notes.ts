// can not select dead characters in progression game
// can not select starting floor higher than the highest starting floor reached by any selected character
// selecting characters with higher floor levels allows changing to higher starting floor
// - selecting away from character that previously allowed a higher starting floor changes the
//   selected floor to the new max
//
// LADDER RANKINGS
// on ladder death, other players see death message
// on ladder rank up, other players see message
// on ladder death/rank change, ladder page request shows correct rankings
//
// SAVED CHARACTER MANAGEMENT
// only auth user can create characters
// can create characters up to slot capacity
// can delete characters
// can not create a character in a slot with an existing one
//
//
// DONE
// can select characters in progression game
// other user sees character being selected
// other user sees default character of other player when they join
// only auth user can create game
// can not create game without a saved character
// if error out of creating a game, can go create a saved character and then create a game
// can not create game if in another game on same session
// only auth user can join game
// can not join game without a saved character
