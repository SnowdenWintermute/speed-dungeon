//  what do with the records if someone abandons?
//
// untested/deferred
// - Ironman saved run slots can hold a game of any character control scheme
// - Save the "time saved" for resuming timers (time spent on current floor) when game loaded
// - Possibly save at other checkpoints to mitigate data lost on game server crash
// it("continue run from older game version", async () => {
//   // try to load a run from older game version
//   // error - old game version
// });
//
//
//  FLOOR DESCENT RECORDS
// -- the following are shared logic with RankedRace mode: move to a shared mode test suite
// expect to find saved party time spent on floor record
// expect to find saved character time spent on floor records
// expect the time on the floor time records to be correct
// descend another floor
// check records for 2nd floor descent to ensure the timers are being reset
