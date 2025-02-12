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
