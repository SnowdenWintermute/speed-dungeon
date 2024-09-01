// CLIENT
// - if melee, animate client to the "inner swing radius" unless they're already there
// - start their attack animation with frame event
// - play the animation so it takes up the entire "action performance time"
// - frame event applies hpChange, mpChange, and status effect changes
// - frame event starts hit recovery/evade/death animation on targets
// - animation manager for target has separate slot for hit recovery animation as a "prioritized animation" but continues
//   progressing "main animation" in the background so it can be switched back to after hit recovery completion
// - handle any death by removing the affected combatant's turn tracker
// - handle any ressurection by adding the affected combatant's turn tracker
// - on animation complete, start next action
export default function performCombatActionActionCommandHandler() {}
