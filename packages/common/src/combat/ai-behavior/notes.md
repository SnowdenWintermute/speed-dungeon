- considered combatants collection with filtering function
    - low hp allies
    - low hp enemies
    - all enemies
    - all allies
    - recent targets of this pet's owner
    - enemy at the top of user's threat meter
- get all owned actions and rank combinations which we currently have the resources to use,
  are wearing the required equipment to use, are not on cooldown
    - healing rank 1
    - healing rank 2
    - attack rank 1
- get all owned action/rank possible action intents that include combatants
    - healing rank 1 on target A
    - healing rank 1 on target B
    - healing rank 2 on target A
    - healing rank 2 on target B
    - healing rank 2 AOE
- evaluate list of valid action intents by some criteria
    - most expected healing on lowest HP target
    - most expected damage on lowest HP target
    - most expected damage on any target
    - most expected healing for the least mp to healing ratio
    - most expected damage on any target without going on to top of a threat meter
- select action with highest evaluation score

// AI Ideas
// export enum AIActionSelectionScheme {
// Basic,
// Protective,
// }
// export enum AIHostileTargetSelectionScheme {
// // chooses random targets
// Random,
// // attacks the target which has the most combined:
// // - damage on the targeter
// // - total healing done
// // - total threat from other actions such as casting buffs
// Enmity,
// // attacks the target which it will do the highest average damage to
// Opportinist,
// // attacks the target with the lowest HP
// SimpleExploiter,
// // attacks the target which it has the highest chance of bringing to the lowest HP
// // in other words, it takes into account both the lowness of their HP and the damage
// // which can be done to them. If there is a highly protected target with low HP, it won't
// // be preferred to a higher hp target with low protection if that target can be reduced to a lower HP
// // on average by the targeting combatant's attack
// IntelligentExploiter,
// // attacks the target which the attacker and its allies have the highest chance of killing
// // before the target gets their next turn
// Strategist,
// }

// export enum AIFriendlyTargetSelectionScheme {
// // attemts to heal any ally with hp below a defined threshold
// Healer,
// // attemts to keep all known buffs active on all allies
// Buffer,
// }
