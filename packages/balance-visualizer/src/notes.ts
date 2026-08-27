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

//
// 55 95 166 vs 70 111 175
//
// No evasion (500 runs)
// 72	105	176	66-79
// With Evasion
// 59	92 147 63-75
// Rogue Bow
// 66	85	111	29%	69-82
// Warrior 2h
// 51	98	162	36%	66-81
// Mage 1H
// 61	101	162	37%	51-61
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
