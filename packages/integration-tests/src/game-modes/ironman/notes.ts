// untested/deferred
// - Ironman saved run slots can hold a game of any character control scheme
// - Save the "time saved" for resuming timers (time spent on current floor) when game loaded
// - Possibly save at other checkpoints to mitigate data lost on game server crash
//
// Ironman Continue Run
// - On game start, set the party.timeCurrentFloorReached to something like it was reached at a time in the past equal to
//   the time it had been from when it was really reached to the time the game was saved
// - On any player leaving the game, save and close the game for all players
//
// Ironman Abandon run
//
// Ironman Run Cleanup (on wipe or escape)
// - delete the run's persistence record
//
// ironman game closed before reconnection
// - player disconnects from ironman run
// - other player in run intentionally leaves
// - run should be closed if any player intentionally leaves
// - disconnected player connects to lobby
// - lobby finds that the run they dc from no longer is in the game session store
// - they don't try to reconnect
//
// ironman run other players set back to lobby on other player leave game
