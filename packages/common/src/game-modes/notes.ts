// User Account Game Persistence
// - 3 Progression Singles Character slots
// - 3 Progression Teams character slots
// - 2 Ironman SingleControl game slots (references to a saved run which holds their user/player association)
// - 1 Ironman MultiControl game slot (references to a saved run)
//
// User Account Ladder Data
// - Ranked Race singles game history
// - Ranked Race teams game history (victories, defeats, character levels, floor times)
// - Ironman run summaries (various summary info about a run that ended)
// - Ironman time-on-floor records (spent x ms on floor y before descending)
// - Ironman time-to-floor records (reached floor x in y ms, derrivable from time-on-floor records?)
//
// Freelancer Control Scheme
// Progression
// - create/join game
// - placed into default auto-created party
// - if user has no living characters, show a character creation UI
// - if user has available characters, they can select one to add to the party
// - if user has open character slots, they can call up the character creation UI
// - if one or more characters is in the party and all users ready up, game starts
// - any player with a character in the party may select a starting floor up to the highest common floor
//   reached among all characters
//
// Ironman Fresh Run
// - Same as progression except all players must use the character creation UI to make new characters
// - Floor selection disabled / hidden (all characters would only reached floor 1 anyway, no need to change floor selection rules)
// - On game start, starts a timer for ranking their per-floor times and fastest times-to-floor
// - On each floor descent, save an "ironman party reached floor x in y milliseconds" record
//   associated with each player's account in the "Speedrun Singles" ladder (one record referencing their account ids)
// Ironman Continue Run
// - Ironman run entire Game class is serialized at "checkpoints"
// - Any user who had a character in the run can create a game to resume it
// - On creation, the game acquires a lock on the "save file" preventing two games trying to continue the same run
// - Characters which the owning player has not yet joined show greyed out until their owner joins
// - Once all participating players joined, they can ready up and start the game
// - On start, resume the game's "Speedrun Timer"
// - On game end, remove the lock on the saved game so it can be resumed later
// - On any player leaving the game, save and close the game for all players
//
// Unranked Race
// Ranked Race
// - Players can create their own party or join an existing one
// - Once at least two parties with at least one character per party exist, players can ready up and start
// - On party defeat:
//   - if ranked, save a loss record
//   - Send message to other parties
// - On party reach designated floor,
//   - if ranked, save a ladder record of party victory in X place (1st, 2nd etc)
//   - associate that ladder record with each player that was in the party
//
// Captains Control Scheme
// Progression
// - create/join game
// - placed into default auto-created party
// - if user has no living "multi-control-mode" characters, show a character creation UI
// - if user has available "multi-control-mode"  characters, they can select and add to the party
// - if user account has open character slots for "multi-control-mode"  progression, they can call
//   up the character creation UI
// - if the party has any characters (even a party of one is valid), the player can start the game
// - the player may select a starting floor equal to the highest floor reached by any selected character
// Ironman Fresh Run
// Ironman Continue Run
// - a user account either has a current run (auto continue it), or must create a new team
//   and start a run
// Unranked Race
// Ranked Race
// - players each create a party (one player per party, player can make multiple characters)
// - on team creation, add a party to the game with the player and their team's characters
//
// LOCAL/OFFLINE (user control one or more characters "Captains mode")
// Progression
// Ironman
// Speedrun
