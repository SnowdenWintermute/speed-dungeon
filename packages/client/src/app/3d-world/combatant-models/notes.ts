// get some action result
// put model actions in characterModel's queue
// characterModel may already be processing active modelActions
//
// characterModels check for new modelActions
// if idling, start processing the modelActions
//
// some model actions may induce model actions such as hit recovery on
// other models
//
// those models should imediately process the hit recovery model action
//
// if still alive, return to processing their other model actions
//
// combatant is idling
// combatant is hit
// start playing hit recovery with transition from idle
// combatant is hit with 2nd attack
// restart hit recovery animation
// finish animation
// idle
//
//
// combatant is idling
// combatant is hit
// start playing hit recovery with transition from idle
// combatant missed by 2nd attack
// start playing evade animation with transition from hit recovery
// finish animation
// idle
//
// combatant is halfway through some action
// induce hit recovery
// if currently in hit recovery / evade, restart the animation (or play alterate one)
//
//
// possible actions to interrupt
// idling
// - immediately set hit recovery to active and play animation
// approach destination
// - keep moving and save what animation they were doing
// - immediately set hit recovery to active and play animation
// -
// hit recovery
// - delete current hit recovery and set animation frame to 0
// - replace active hit recovery and reset animation
// evade
