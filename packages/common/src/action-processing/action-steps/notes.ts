// MAIN BRANCH - slice attack
// - move user into start use position in front of main target - PRE-USE POSITIONING (combatantMotion)
// - pay costs - cost paid update - CALCULATE ACTION COSTS
// - check on-use triggers - triggers activated update - CHECK ONUSE TRIGGERS
// - start use animation - entity motion update for attack and step forward START-USE MOTION (entityMotion) (client will add own "cosmetic vfx")
// - roll hit outcomes - hit outcomes update client shows floating text - ROLL HIT OUTCOMES
// - check hit triggers - triggers activated update - CHECK HIT OUTCOME TRIGGERS
//   BRANCH x X - for each combatant that countered
//    - start counterattack use animation - START USE ANIMATION
//    - roll hit outcomes - ROLL HIT OUTCOMES
//    - roll hit triggers - CHECK HIT TRIGGERS
//    - start post use animation - POST-USE ANIMATION
// - start user post-use animation - POST-USE ANIMATION
// - start user move home - POST-USE POSITIONING
// - end turn - END TURN
//

// MAIN BRANCH - ranged attack
// - move user into position - START-USE POSITIONING
// - spawn arrow vfx attached to combatant hand or bow string bone - SPAWN VFX ENTITY (parentType OR position) (spawnEntity update)
// - start user use animation - START-USE ANIMATION
// - pay costs
// - check on use triggers
// - BRANCH - arrow fired
//   - move knocked arrow vfx toward target
//   - roll hit outcomes (client will animate target hit recovery, block or parry)
//   - check hit triggers
// - start user post use animation
// - start user move home
// - end turn
//
// MAIN BRANCH - firebolt
// - move user into position - PRE-USE POSITIONING
// - start user animation - START-USE MOTION (client will animate cosmetic "charge up spellcast" effect)
// - pay costs
// - check on use triggers - client will animate combatant counterspell animation
//   - IF SUCCESS, BRANCH
//     - spawn firebolt vfx - SPAWN VFX ENTITY (spawn entity update)
//     - start animating/translating firebolt vfx toward target VFX MOTION (entityMotion update)
//     - roll hit outcomes client will animate target hit recovery, spell parry or resist
//     - check triggers - client will animate cosmetic "reflect" effect
//        - IF REFLECT - BRANCH
//          - spawn firebolt vfx SPAWN VFX ENTITY
//          - send firebolt from target toward caster VFX MOTION
//          - roll hit outcomes
//          - check hit outcome triggers
//
//     - animate firebolt explosion or dissipation
// - start user post use animation POST-USE MOTION (if countered, countered animation, else spellcast-complete animation)
// - start user move home
// - end turn
//
// MAIN BRANCH - blizzard
// - move user into position
// - spawn ice spellcast chargeup effect vfx attached to combatant weapon or hand
// BRANCH
//  - start animating the chargeup effect
// - start user animation
// - pay costs
// - check on use triggers - client will animate entity counterspell animation
// - BRANCH
//   - IF COUNTERED
//     - spawn spellcast countered effect
//     - start animating spellcast countered effect
//   - IF SUCCESS
//     - spawn ice-spellcast-success effect on combatant weapon or hand
//     - spawn ice storm vfx
//     - start animating ice storm vfx until a certain time
//     - roll hit outcomes - client will animate target hit recovery, spell parry or resist
//     - check triggers
//     - finish ice storm animation
// - start user post use animation
// - start user move home
// - end turn
//
// MAIN BRANCH - chaining split arrow
// - move user into position
// - spawn 3x arrow vfx attached to combatant hand or bow string bone
// - start user use animation
// - pay costs
// - check on use triggers
// - BRANCH x 3 - arrow fired
//   - move knocked arrow vfx toward target
//   - roll hit outcomes (client will animate target hit recovery, block or parry)
//   - check hit triggers
//   - despawn arrow vfx
//   - spawn new arrow vfx
// - start user post use animation
// - start user move home
// - end turn
//
//
// steps must
// - create an initial gameUpdateCommand
// - write to the gameUpdateCommand when ticked
// - determine any branching sequences
// - determine the next step

// Behavior tree for action with post-chambering projectile
// succeeder
// SEQUENCE
// INITIAL POSITIONING (entityMotion)
// CHAMBERING MOTION (entityMotion)
// POST-CHAMBERING SPAWN ENTITY (spawnEntity)
// DELIVERY MOTION (entityMotion)
// PAY ACTION COSTS (costsPaid)
// ON-ACTIVATION TRIGGERS (activatedTriggers)
// Selector
// - if not countered
//   - create new projectile action branch
// - if countered
//   - do nothing
// POST-USE MOTION (entityMotion)
// POST-USE POSITIONING (entityMotion)
//
// Behavior tree for projectile action
// Sequence
// ON-ACTIVATION SPAWN ENTITY (spawnEntity)
// ON-ACTIVATION VFX MOTION (entityMotion)
// ROLL HIT OUTCOMES (hitOutcomes)
// HIT OUTCOME TRIGGERS (activatedTriggers)

// PRE USE POSITIONING (entityMotion)
//  - get destination from action and targets
//  - move toward a melee target or in case of ranged move a little forward from home position
// PRE-USE MOTION (entityMotion)
//  - ex: raise hand to draw arrow from quiver
//  - ex: bring wand back to where we want to start "magical particles" around the wand
// PRE USE SPAWN ENTITY (spawnEntity)
//  - ex: spawn an arrow parented to the user's hand
//  - ex: spawn a magical particles vfx entity on the user's wand
// CHARGE-UP-TO-ACTIVATE MOTION (entityMotion)
//  - ex: draw bowstring back and animate bow bending
//  - ex: start animating magical particles around the wand
// PAY ACTION COSTS (costsPaid)
//  - get costs from action context
// ON-USE TRIGGERS (activatedTriggers)
//  - roll
//  - post results to action billboard
//  - skip to post-use positioning step if countered
//  - if success, get next step based on action
// ON-USE SPAWN ENTITY (spawnEntity)
//  - ex: spawn a firebolt in front of the wand
// ON USE VFX MOTION (entityMotion)
//  - ex: translate associated projectile toward its target
//  - ex: animate non-projectile spellcasting effect around targets
// ROLL HIT OUTCOMES (hitOutcomes)
// HIT OUTCOME TRIGGERS (activatedTriggers)
//  - may cause branching actions
// POST-USE MOTION (entityMotion)
//  - check billboard - may be affected by on-use triggers
//  - skip to post-use positioning step if countered
//  - if success, get next step based on action
//  - if there is a counterattack on the billboard
// POST-USE POSITIONING (entityMotion)
