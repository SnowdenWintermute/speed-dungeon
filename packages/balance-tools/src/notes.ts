// order of derivation
// - declare set of weapons with arbitrary damage ranges and no requirements
//   - declare drop rates by encounter
// - make attributes with arbitrary effects on attack damage
//   - declare system by which attributes are acquired
//     - equipment affixes
//     - discretionary points
//     - inherent
// - calculate total accuracy available to a combatant by encounter
// - declare a designedAccuracyAllocationPercentage
// - derive expectedAccuracy from ( availableAccuracy * designedAccuraceyAllocationPercentage )
// - declare a designedAverageChanceToHit
// - derive monster evasion from expectedAccuracy and designedAverageChanceToHit
// - calculate average damage against target dummies with monsterEvasion using
//   best available equipment and allocated attributes by encounter (sampledAttackDamage)
// - declare a designedAttackDamageAllocationPercentage
// - derive average attack damage by encounter from applying designedAttackDamageAllocationPercentage
//   to the sampledAttackDamage study
//
// - declare set of armor with arbitrary armor class
//   - declare drop rates by encounter
// - assign attribute requirements to the armor types based on the new sampledAttackDamage study
//   attributes
//   - automatically assign by the armor's availability by room
//     and a given combatant spec's average attributes in the room
//     which is the median of rooms in which the item could drop
//     or some other availabilityPercentile
//
// - assign attribute requirements for weapons based on study's
//   combatant average attributes when the weapons are available
// - re-run the attack damage study with attribute requirements active
// - compare to previous study without attribute requirements
// - possibly tune requirements if average attributes are significantly lowered
//
// armor enjoyer goal
// - copies mean attributes from a certain build in another study's table room by room
//   - includes from gear because already those attributes are modified by an allocation intensity
// - prunes equipment by requirements and armorclass
// - wants highest armor class
//
// shield warrior
// 	37	64	89
// shield mage
//  19	42	64
// bow rogue
// 	6   18	32
// staff ice bolt mage
// 	8 	25	41
//
// to determine
// - monster armor class
//  - determine how much a "heavily armored" monster should reduce
//    incoming physical damage by
//  - determine how much an averagely armored monster should reduce it by
//  - and a weakly armored (but not 0 armor) monster
//  - use the armor class reverse function to get the range
// - monster agility
//  - reverse engineer from evasion
// - monster hp
//  - determine how many hits we want to take to kill a monster
//  - multiply that by the average damage done to the average armored average evasioned target dummy
// - monster attack damage
//  - run an HP enjoyer study
//  - run an armor enjoyer study
//  - determine desired player evasion allocation
//  - determine how many hits it should take to kill a player
//
// - character armor class
//  - armor class loot solver
//  - needs armor attribute requirements
// - armor attribute requirements
//  - derive from attributes an attack damage spec'd class
//    would have on the floor an equipment is most likely to appear on
//
// - block chance effect
// - shield user goals
// - parry chance effect
//
// - character hp
//
