// LadderGameRecord (for ironman/races)
// - game name
// - game mode
// - control mode
// - time started
// - time completed
// - References to participating PartyLadderRecords
// - Winner derrived from party records timeOfEscape
//    .can rank them by time escaped for 2nd, 3rd place)
//    .only races would have a winner

// PartyLadderRecord
// - ref to LadderGameRecord
// - partyId
// - partyName
// - timeOfEscape
// - timeOfWipe
// - references to LadderCharacterRecords
// - references to LadderPartyFloorClearTime records
//
// LadderPartyFloorClearTimeRecord
// - partyId
// - floor number
// - timeToReach
// - timeToClear
//
// LadderCharacterRecord
// - characterName
// - combatantClass
// - level
