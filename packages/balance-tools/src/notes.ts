// purpose
// "[numbers] don’t exist in a vacuum, but only in comparison with other numbers" - Game Balance 2022 Ian Scheiber and Brenda Romero
// - develop an automated pipeline to allow for quickly balancing
// any value or relationship between values in the game
//
// example situations
// - we find that equipment upgrades don't feel impactful for players
//   so we might increase the value range of affix rolls on magical
//   equipment. Now the total attributes a character can have has increased
//   and all monster's attributes must rebalance to account for that.
// - We find that allocating to agility (therefore speed) contributes far
//   more damage-per-turn than allocating equivalent points to strength/dex/spirit.
//   We need to tune either the agility:speed ratio, or change how speed effects
//   turn count.
//
//
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
// - declare a designed allocationIntensity for character's investment in attack damage
// - calculate average damage against target dummies, room by room, with monsterEvasion and monsterAgility using
//   best available equipment and allocated attributes by encounter (sampledAttackDamage)
//   with allocated attributes and equipment affixes multiplied by designedAttackDamageAllocationIntensity
// - declare a designedKineticDamageReductionPercentageFromAverageMonsterArmorClass
// - derive monster armor class from averageTooltipMainHandDamage and designedKineticDamageReductionPercentageFromAverageMonsterArmorClass
// - declare a designedAverageMonsterToCharacterTurnCountRatio (probably 1:1)
// - calculate the total speed available to characters room by room
// - declare a designedCharacterSpeedAllocationIntensity
// - derive the average speed room by room for characters from
//   designedCharacterSpeedAllocationIntensity * availableSpeed
// - derive monster speed by room from characterSpeedByRoom, designedAverageMonsterToCharacterTurnCountRatio, and
//   a speed difference to turn count ratio formula
//
// - declare a designedTurnsToKillMonsterWithAttackAction
//
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
