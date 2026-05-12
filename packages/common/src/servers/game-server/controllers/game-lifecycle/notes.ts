// Progression Singles
// - Create game
// - Create default party
// - If user has existing character, select it
// - If no existing character, show character creation
// - Create new character
// - Select from old characters
// - Other players can join and create/select characters in the party
// - Select starting floor
// - Ready up

// Progression Team
// - Create game
// - Create default party
// - If user has existing living saved team, select it
// - Select team
// - Create new team
// - Select starting floor
// - Ready up
// - On party wipe, mark team as wiped
//
// Multi Controller Ironman
// - Create game
// - Select team
// - Create new team
// - Starting floor and room automatically selected
// - Ready up
//
//
// Game Mode Specific Concerns:
// getDescription
//
// userHasRequiredResources
// - do they have an eligible saved character / saved team
// userCanJoin
// - if mode requires, are they authenticated
// - userHasRequiredResources
//
// onGameStart
// onBattleResult
// onGameLeave
// onLastPlayerLeftGame
// onPartyEscape
// onPartyWipe
// onPartyVictory
