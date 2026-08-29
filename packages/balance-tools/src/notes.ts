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
//

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
//
// AnalysisRun distinguished by
// - what it reports
// - what it can export based on its report
//
// - instead of the instance, can store the type
//   of goal performance checker on the AnalysisCharacterSpecification
//   to survive worker boundary and allow for shareable
//   seeded rng and target dummy when constructed by the run
// - will likely need type and config object for saying
//   "sample these actions, at this rank". Attack currently
//   needs to customly sample main and offhand attack actions
//   so might need a (config:Config) => samplerFunction map
// - share the beginComparisonScope()
//   between goal performance checkers
//   so the RNG is same, regargdless of the goal
// - type the goal performance units with tagged union
//   so for now we only allow compatible (same for now)
//   types in a run and throw if not. Later can make conversion
//   ratios between types. Proportional won't work without knowing
//   the ratios, like Chris Wilson's "Effectiveness" from
//   https://www.pathofexile.com/forum/view-thread/55099
//
// - agree, goal must own attributesToTry, equipmentDominationAxes
//   and merge domination axes from all goals in the solver
// - agree, view slicing by goal in AnalysisSampleDimensions
//   is good idea
