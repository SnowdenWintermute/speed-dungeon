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
//
//
//
// NEW COMMANDS BASED CLIENT/SERVER SETUP
// - calculating commands for client anyway
// - enable replays
// - enable resync
// - prevent cheating by client sending inputs earlier than allowed
// - avoid complex client translation of action results into commands
//
// client sends combat action input
// - attack
// - client locks own interface
// - on recieve next reply with own entity id, will unlock at end of command sequence playback
//
// server creates a chain of commands
// - lock entity
// - move toward destination
// - perform combat action (mh melee attack) (entity id, damage, isCrit, element, isWeakness)
// - perform combat action (mh offhand attack) (entity id, damage, isCrit, element, isWeakness)
// - return home
// - end turn
//
// server sends chain of commands to client
//
// server starts processing commands
// - lock entity
//   [] no commands may be issued to this entity while locked
// - move toward destination:
//   [] start a timer based on the entity's distance to target and their movement speed
//   [] we'll need to know hitbox radii of all combatant models
// - perform combat action (mh attack)
//   [] start a timer based on attack animation length
//   [] on specified frame, deal damage (entity id, damage, isCrit, element, isWeakness)
//   [] on animation complete, start next action
// - perform combat action (oh attack)
//   [] start a timer based on attack animation length
//   [] on specified frame, deal damage (entity id, damage, isCrit, element, isWeakness)
//   [] on animation complete, start next action
// - return home
//   [] start a timer based on distance to home location
//   [] end turn if action required turn
//   [] unlock entity
//
//
// client starts processing commands
// - lock entity
//   [] grey out their UI
// - move toward destination:
//   [] transition from idle to move-forward animation
//   [] translate/rotate combatant model position toward the outer swing radius of their target
//   [] when within swing radius, start next action
// - perform combat action (mh attack)
//   [] continue translating combatant model to inner swing radius
//   [] transition from move-forward to melee-attack animation
//   [] on specified frame, deal damage (entity id, damage, isCrit, element, isWeakness)
//      * target entities start transition to hit recovery animations
//      * play floating text on target entities
//      * show combat log entries
//      * on hit recovery complete, transition to idle
//   [] on animation complete, start next action
// - perform combat action (oh attack)
//   [] transition from melee-attack to melee-attack-offhand animation
//   [] if no melee-attack-offhand, restart melee-attack animation
//   [] on specified frame, deal damage (entity id, damage, isCrit, element, isWeakness)
//   [] on animation complete, start next action
// - return home
//   [] transition to move-back animation
//   [] translate/rotate entity to their home position
//   [] end their turn if action required turn end
//   [] unlock entity
//
//
// WHEN OUT OF COMBAT
// - players may input actions simultaneously
// - actions will be processed sequentially in the order recieved
// - client will play actions back sequentially
