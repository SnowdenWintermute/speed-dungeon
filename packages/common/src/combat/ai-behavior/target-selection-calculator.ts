export enum AIActionSelectionScheme {
  Basic,
  Protective,
}

export enum AIHostileTargetSelectionScheme {
  Random,
  Enmity,
  Opportinist,
  SimpleExploiter,
  IntelligentExploiter,
  Strategist,
}
// how an ai will select it's target
//
// types of target selection
// - random
//   - it randomly selects targets
//
// - threat/aggro - attacks the target which has the most combined
//   - damage on the targeter
//   - total healing done
//   - total threat from other actions such as casting buffs
//
// - opportunist
//   - attacks the target which it will do the highest average damage to
//
// - simple exploiter
//   - attacks the target with the lowest HP
//
// - intelligent exploiter
//   - attacks the target which it has the highest chance of bringing to the lowest HP
//   in other words, it takes into account both the lowness of their HP and the damage
//   which can be done to them. If there is a highly protected target with low HP, it won't
//   be preferred to a higher hp target with low protection if that target can be reduced to a lower HP
//   on average by the targeting combatant's attack
//
// - strategist
//   - attacks the target which the attacker and its allies have the highest chance of killing
//   before the target gets their next turn
//
//
