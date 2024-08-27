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
// possible actions to interrupt
// idling
// - immediately set hit recovery to active and play animation
// approach destination
// - keep moving and save what animation they were doing
// - immediately set hit recovery to active and play animation
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
//      * on hit recovery complete, transition to whatever animation they should be doing for their current action
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
// - show a "readying up idle" pose animation while waiting for
//   other characters ahead in queue to perform their actions
//
//
//
//
//
//
//
//
//
//
// POTENTIAL SCENARIOS
// no current animation exists
//  - clone new animation
//  - start new animation
//  - start increasing weights

// current (different) animation still playing
//  - set current as previous
//  - clone new animation and set as current
//  - start new animation
//  - start increasing weights of new animation
//  - start decreasing weights of previous animation
//  - stop previous animation when weights = 0
//  - when weights = 0 dispose previous animation and set to null
// current animation was play-once and completed
//  - stop current animation
//  - set current animation weights to 0
//  - dispose current animation
//  - clone new animation and set as current
//  - start new animation
//  - start increasing weights
// previous animation is same as new animation and is not completed
// previous animation is same as new animation and is play-once and completed
//  - if we always clone new animations it should be
//  the same process as if starting a different animation
//
//
// start new animation playing
// start increasing weight of new animation
// if current animation exists
//   start decreasing weight of previous animation
//   if is done, stop previous animation and set weight 0
