// MECHANICS
// - fastest a single run (average access to speed but fully allocating all available) player character
//   should be is 1.51x the average monsters (2.32 hasted) - tweak numbers to create TURN_RATIO_CAPS
// - casting haste or slow should raise the turn ratio cap, allowing for greater
//   ratios to exist between affected combatants and other combatants
// - moderately allocated speed character 1.26 turns of average monster (get's double turn on 4th round)
//   (tweak ratio to get DESIGNED_FAST_CHARACTER_TARGET_RATIO), et al for "slow" and "average" speed characters
//   - fast monsters about 1.75x speed to average characters
//   - slow monsters .8
// - bosses (single enemies) need at least 3:1 turn ratio to average player characters in 3v1 fights,
//   or, bosses get more action points on their turns
// - slow monster on floor should be just below the slowest character's inherent speed on that floor

// TENETS
// - speed must not become strictly better than other attributes by affording too much turn ratio
// - It should be reasonably easy to get the party's fastest character to be first to act in battles
//   against average speed monsters
// - players should have compelling reasons to not "always fulfil the turn ratio max cap before all else"
//   and instead get other attributes

// INSIGHTS
// - starting level 1 characters with a large baseline speed offsets the effect of adding
//   your first point. If you start with 1 point and add 1, thats a 100% increase. If you
//   start with 100 and add 1 that's an increase of 1%
// - it is probably the most fun if players and monster mostly get even amount of turns
// - the most important breakpoint is enough speed to move first in the battle before monsters
// - the longer the designed battle turn length, the less important the first mover advantage is
// - longer battles allow small speed differences to matter eventually (trade turns with monster
//   until third turn then you move twice before their fourth turn)

// Speed Breakpoints
// - At what value will character act first vs monster
// - At current value, after how many monster/character turn pairs will the monster get two turns in a row
// - At current value, after how many character/monster turn pairs will the character get two turns in a row
// - need to determine the effect of speed on a combatant's attackDamagePerTurn and a combatant's
//   turnsPerBattleCombatantCountTurns in a battle of six combatants
//
// let's say that designedTurnsToKillMonsterWithAttackAction = 4 and designedTurnsToKillMonsterWithManaCostAction = 1.5
// so weak monsters can be one shot with mana actions, average monsters can be killed with one mana action and one attack.
// this way all player characters hitting same monster don't kill unless one uses their mana.
//
// designedTurnsToKillMonsterWithAttackAction = 4
// designedPercentHpToDamageMonsterWithAttack = .25
// designedTurnsToKillMonsterWithOffensiveAction = 1.5
// designedPercentHpToDamageMonsterWithOffensiveAction = .66
// designedFrequencyOfAttackUseOnTurn = 0.4
// designedFrequencyOfOffensiveActionUseOnTurn = 0.4
// designedFrequencyOfSupportActionUseOnTurn = 0.2
// percentMonsterHpDamagePerTurn = derivable from above
// -- Assuming all player characters have 100% uptime (no deaths) --
// playerTurnsToKillMonster = CIEL(1 / percentMonsterHpDamagePerTurn)
// totalPlayerTurnsPerBattle = playerTurnsToKillMonster * monsterCount
// combatantDamagePerTurn = monsterAvgHitPoints * percentMonsterHpDamagePerTurn
// turn ratio cap 1:1.51 1:2.3 ( hasted )
// allocationIntensityToReachCap = .5
// allocationIntensityToReachHastedCap = .6
// allocationIntensityToMoveFirst = 0.3
//
// Delay Tiers:
// - Slow: 0 agility allocated, low inherent agility
// - Average: 1/10th agility allocated, average inherent agility
// - Fast: 3/10th agility allocated, high inherent agility
//
// within the attainable speed of an average run the turn ratios should
// end up like:
// - Slow to Average: 1:1.34
// - Slow to Fast: 1:1.66
// - Slow to Fully Allocated: 1:2.49
// - Slowest speed in game to Max attainable in game with perfect gear: 1:3
//
// slowestMonsterSpeedInGame = a number chosen by us, presumably lower than speed of lowest speed character at level 1
// averageUnallocatedCharacterSpeed = known, taken from average of all characters (with support class), room by room
// fastestCharacterAttainableSpeed = known
// delayAfterActionUse = ?
//
// must be tweakable
// slowMonsterToUnallocatedSlowCharacterTurnRatio 1:1.15
// unallocatedSlowCharacterToAverageTurnRatio 1.1.15
// slowToAverageTurnRatio = 1:1.34
// averageToFastTurnRatio = 1:1.34
// slowToFastTurnRatio = 1:66
// slowToFullyAllocatedTurnRatio = 1:2
// allocationIntensityToReachAverageTier = 0.1
// allocationIntensityToReachFastTier = 0.4
//
// Monster Speed Tiers - we define or derive speed values
// - slow monster
// - average monster
// - fast monster
// - fast boss monster
//
// Player Character Speed Tiers - derived from base values and attribute studies
// - slow character - slowest speed class/support class combo with no allocations to agility
// - average character - average class/support class combo with DESIGNED_AVERAGE_CHARACTER_AGILITY_ALLOCATION_INTENSITY
// - fast character - fastest class/support class combo with DESIGNED_FAST_CHARACTER_AGILITY_ALLOCATION_INTENSITY
//
// DESIGNED_AVERAGE_CHARACTER_AGILITY_ALLOCATION_INTENSITY = 0.1
// DESIGNED_FAST_CHARACTER_AGILITY_ALLOCATION_INTENSITY = 0.4
