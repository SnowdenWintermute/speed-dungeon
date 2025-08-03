// Before executing this tree, if the combined expected average damage of
// the AI's sequential turns, accounting for forced aggro targets, can wipe the player party, do that instead
//
// Healing Action and Target Selection
// - Determine average expected damage output of player party
// before the next AI healer's turn, based off of:
//   - Simple/Omniscient - all known stats and actions of enemy combatants
//   - Observed damage done so far in the battle by player characters
//   - If the AI is "Good at assessment", player character's stats and
//     - known actions taken OR
//     - common actions that the player's class would have
// - Collect allies by risk status
//   - Emergency (could be killed by expected damage)
//   - MaintenanceOpportunity (missing some HP, but has enough HP and defenses to survive until healer's next turn)
//   - Unbothered
// - For targets at Emergency status
//   - Sort by
//      - "Is savable" (do we own an action that can remove them from Emergency status)
//      - "how much we want this ally to live"
//      - lowest HP
//   - Collect usable actions
//   - Collect actions which could bring their HP out of Emergency status
//   - If no damaging actions are owned, and no MaintenanceOpportunity targets exist, or
//     "try your best to save them mode " is active,
//     also collect actions which have any healing effect even if it won't
//     heal enough to save them. Otherwise we should fail here and just damage
//     the enemy team or try to heal up a healthier target.
//   - Sort collected actions by
//       - Healing done to primary target
//       - Healing done to entire team
//       - Resource cost of action
