export enum AllocationProhibitedReason {
  NotInTree,
  InherentTrait,
  MaximumRank,
  NoUnspentPoints,
  CombatantTooLowLevel,
  PrerequisitesNotMet,
}

export const ABILITY_ALLOCATION_PROHIBITED_REASON_STRINGS: Record<
  AllocationProhibitedReason,
  string
> = {
  [AllocationProhibitedReason.NotInTree]:
    "That ability is not in any of that combatant's ability trees",
  [AllocationProhibitedReason.InherentTrait]:
    "That trait is inherent to the combatant and can not be allocated to",
  [AllocationProhibitedReason.NoUnspentPoints]: "No unspent ability points",
  [AllocationProhibitedReason.MaximumRank]: "That ability is at its maximum rank",
  [AllocationProhibitedReason.CombatantTooLowLevel]:
    "That character is too low level to allocate to this ability",
  [AllocationProhibitedReason.PrerequisitesNotMet]: "Requires prerequisite",
};
