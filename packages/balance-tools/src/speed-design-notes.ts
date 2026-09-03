// MECHANICS
// - fastest a single run (average access to speed but fully allocating all available) player character
//   should be is 1.51x the average monsters (2.32 hasted) - tweak numbers to create TURN_RATIO_CAPS
// - casting haste or slow should raise the turn ratio cap, allowing for greater
//   ratios to exist between affected combatants and other combatants
// - moderately allocated speed character 1.26 turns of average monster (get's double turn on 4th round)
//   (tweak ratio to get DESIGNED_FAST_CHARACTER_TARGET_RATIO), et al for "slow" and "average" speed characters
//   - fast monsters about 1.75x speed to average characters
//   - slow monsters .8
// - bosses (single enemies) need at least 3:1 turn ratio to average player characters in 3v1 fights

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
// - longer battles allow small speed differences to matter eventually (trade turns with monster
//   until third turn then you move twice before their fourth turn)

// Speed Breakpoints
// - At what value will character act first vs monster
// - At current value, after how many monster/character turn pairs will the monster get two turns in a row
// - At current value, after how many character/monster turn pairs will the character get two turns in a row
// - need to determine the effect of speed on a combatant's attackDamagePerTurn and a combatant's
//   turnsPerBattleCombatantCountTurns in a battle of six combatants
