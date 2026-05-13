// User Account Game Persistence
// - 3 Progression Singles Character slots
// - 1 Progression Teams character slot
// - 3 Ironman Singles progression slots
// - 1 Ironman Teams game slot
//
// User Account Ladder Data
// - Ranked Race singles game history
// - Ranked Race teams game history
// - Ironman runs history
// - Speedrun singles history
// - Speedrun teams history
//
// SINGLES
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
// Ironman Continue Run
// - Ironman run entire Game class is serialized at "checkpoints"
// - Any user who had a character in the run can create a game to resume it
// - On creation, the game acquires a lock on the "save file" preventing two games trying to continue the same run
// - Characters which the owning player has not yet joined show greyed out until their owner joins
// - Once all participating players joined, they can ready up and start the game
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
// Speedrun
// - Single default party (like progression)
// - Prompt players to create new characters (like fresh ironman run)
// - On each floor descent, save a "party reached floor x in y milliseconds" record
//   associated with each player's account in the "Speedrun Singles" ladder (one record referencing their account ids)
//
// TEAM
// Progression
// - create/join game
// - placed into default auto-created party
// - if user has no living teams, show a team creation UI
// - if user has available teams, they can select one to add all it's characters to the party
// - if user has open team slots, they can call up the team creation UI
// - if the party has any characters (even a team of one is valid), the player can start the game
// - the player may select a starting floor equal to the highest floor reached by their selected team
// Ironman Fresh Run
// Ironman Continue Run
// - a user account either has a current run (auto continue it), or must create a new team
//   and start a run
// Unranked Race
// Ranked Race
// - players each create a team (one player per party, player can make multiple characters)
// - on team creation, add a party to the game with the player and their team's characters
// Speedrun
// - one player per game, must create new team (player can make multiple characters)
// - On each floor descent, save a "party reached floor x in y milliseconds" record
//   for the player's account in the "Speedrun Teams" ladder
//
// LOCAL/OFFLINE (TEAM ONLY)
// Progression
// Ironman
// Speedrun
//
//
// export interface GameMode {
//   persistencePolicy: GameModePersistencePolicy;
//   ladderPolicy: GameModeLadderPolicy;
//   setupPolicy: GameModeLobbySetupPolicy;
//   description: string
// }
//
// export interface GameModeLobbySetupPolicy {
//   gameCanBeStarted (does each player have a required character/party selected)
//   userCanJoin (is user authenticated if required, does user have tournament ticked if required)
//   canSelectStartingFloor (only allowed in Progression)
//   getSelectableTeams // list of user's selectable teams
//   getSelectableCharacters // list of user's selectable characters
// }
//
// /** what to save and how to save it when certain events happen */
// export interface GameModePersistencePolicy {
//   onFloorDescent
//   onGameStart
//   onBattleResult
//   onGameLeave
//   onLastPlayerLeftGame
//   onPartyEscape
//   onPartyWipe
//   onPartyVictory
// }
//
// /** how to update which ladder when certain events happen */
// export interface GameModeLadderPolicy {
//   onFloorDescent
//   onGameStart
//   onBattleResult
//   onGameLeave
//   onLastPlayerLeftGame
//   onPartyEscape
//   onPartyWipe
//   onPartyVictory
// }
