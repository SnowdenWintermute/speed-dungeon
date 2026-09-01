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
// Auto Balancing Pipeline - order of derivation
// BASELINE/FLAVOR
// - declare set of weapons with arbitrary damage ranges and no requirements
//   - declare drop rates by encounter
// - make attributes with arbitrary effects on attack damage
//   - declare system by which attributes are acquired
//     - equipment affixes
//     - discretionary points
//     - inherent
// PLAYER ACCURACY
// - calculate total accuracy available to a combatant by encounter
// - declare a designedAccuracyAllocationPercentage
// - derive expectedAccuracy from ( availableAccuracy * designedAccuraceyAllocationPercentage )
// - declare a designedAverageChanceToHit
// MONSTER EVASION
// - derive monster evasion from expectedAccuracy and designedAverageChanceToHit
// - declare a designed allocationIntensity for character's investment in attack damage
// MONSTER ARMOR CLASS
// - calculate average damage against target dummies, room by room, with monsterEvasion using
//   best available equipment and allocated attributes by encounter (sampledAttackDamage)
//   with allocated attributes and equipment affixes multiplied by designedAttackDamageAllocationIntensity
// - declare a designedKineticDamageReductionPercentageFromAverageMonsterArmorClass
// - derive monster armor class from averageTooltipMainHandDamage and
//   designedKineticDamageReductionPercentageFromAverageMonsterArmorClass
// SPEED
// - declare a designedAverageMonsterToCharacterTurnCountRatio (probably 1:1)
// - calculate the total speed available to characters room by room
// - declare a designedCharacterSpeedAllocationIntensity
// - derive averageCharacterSpeedByRoom from
//   designedCharacterSpeedAllocationIntensity * availableSpeed
// - derive averageMonsterSpeedByRoom from characterSpeedByRoom
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
// SPEED
// - casting haste should increase even a fast character's turn ratio vs monsters
// - speed must not become strictly better than other attributes by affording too much turn ratio
// - the most important breakpoint is enough speed to move first in the battle before monsters
// - longer battles allow small speed differences to matter eventually (trade turns with monster
//   until third turn then you move twice before their  fourth turn)
// - bosses (single enemies) need at least 3:1 turn ratio to average player characters in 3v1 fights
// - fastest a single run (average access to speed but fully allocating all available) player character
//   should be is 2x the average monsters (hasted)
// - moderately allocated speed character 1.25 turns of average monster
// - fast monsters about 1.75x speed to average characters
// - slow monsters .8
// - need to know the max attainable speed in the game
// - need to determine the effect of speed on a combatant's attackDamagePerTurn and a combatant's turnsPerBattleCombatantCountTurns
//   in a battle of six combatants
//
// MAX ATTAINABLE ATTRIBUTES
// - sequentially build each equipment to maximize an attribute
//   - build with each possible prefix at max tier on max floor for this equipment
//   - try on equipment ignoring requirements
//   - check if beats current best
//   - try with each possible suffix
// - we should now have one of each equipment with maximum contribution
//   to the chosen attribute
// - figure out at what threshold of each requirement attribute
//   which equipment become available
//     - at 5 strength: [ short sword ]
//     - at 5 strength 3 dex: [short sword, blade ]
//     - at 10 strength 5 dex:[short sword, blade , broad sword]
// - for each threshold, get the best in slot for all slots
//   which serve the chased attribute
// - rank the thresholds by their best in slot sets' total chased attribute
// - for each threshold's best in slot set's attribute, if the threshold requirements
//   include attributes that don't contribute to the chased attribute, and another
//   discretionary attribute could have contributed to it, reduce its score by that amount
//   (example, we are chasing Hp, a set with +50 hp is at a threshold that requires 10 strength and 5 dex. We could have
//   put those 15 points into Vitality instead, thereby increasing Hp by the Vitalit:Hp ratio, so
//   reduce the score of this set by that amount) (example 2: we're chasing accuracy, a set with +10 accuracy
//   requires 10 strength and 5 dex to wear. We reduce score by 10*dex:accuracy ratio, since the required dex
//   is contributing to our chased attribute)
