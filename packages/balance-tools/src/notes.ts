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
// 	31	66	108	85%	28%	54-68	-	60	11 / 22 / 28	34	5 / 6 / 24	8	1 / 0 / 8	138	15 / 9 / 115	2
//
//

// to determine
// - monster armor class
//  - derive from character armor class
// - monster agility
//  - reverse engineer from evasion
// - monster hp
// - monster attack damage
//
// - character armor class
//  - armor class loot solver
//  - needs armor attribute requirements
// - armor attribute requirements
//  - derive from attributes an attack damage spec'd class
//    would have on the floor an equipment is most likely to appear on
//
// - character hp
//
