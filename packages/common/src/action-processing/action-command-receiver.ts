import {
  BattleResultActionCommandPayload,
  ChangeEquipmentActionCommandPayload,
  MoveIntoCombatActionPositionActionCommandPayload,
  PayAbilityCostsActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "./index.js";
import { ActionCommandManager } from "./action-command-manager.js";

export interface ActionCommandReceiver {
  payAbilityCostsActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: PayAbilityCostsActionCommandPayload
  ) => void;
  // SERVER
  // - apply ability costs to game
  // - process the next command
  // CLIENT
  // - apply ability costs to game
  // - process the next command
  moveIntoCombatActionPositionActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) => void;
  // SERVER
  // - lock this character from recieving inputs
  // - if in combat other characters should have their inputs locked already since it isn't their turn
  // - if not in combat, other character's inputs will be processed in order recieved
  // - add their travel time to destination to the lockout time
  // - process the next command
  // CLIENT
  // - lock/hide this character's ui to show the animation
  // - calculate their destination based on payload target and ability type (melee/ranged)
  // - start animating them toward their destination
  // - on reach destination, process the next command
  performCombatActionActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) => void;
  // SERVER
  // - add the animation time to the lockout time
  // - apply the hpChange, mpChange, and status effect changes from the payload
  // - handle any death by removing the affected combatant's turn tracker
  // - handle any ressurection by adding the affected combatant's turn tracker
  // - get the next action
  // CLIENT
  // - if melee, animate client to the "inner swing radius" unless they're already there
  // - start their attack animation with frame event
  // - frame event applies hpChange, mpChange, and status effect changes
  // - frame event starts hit recovery/evade/death animation on targets
  // - animation manager for target has separate slot for hit recovery animation as a "prioritized animation" but continues
  //   progressing "main animation" in the background so it can be switched back to after hit recovery completion
  // - handle any death by removing the affected combatant's turn tracker
  // - handle any ressurection by adding the affected combatant's turn tracker
  // - on animation complete, start next action
  returnHomeActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ReturnHomeActionCommandPayload
  ) => void;
  // SERVER
  // - end the combatant's turn if in combat and action required turn
  // - check for party wipes and victories and apply/emit them
  // - unlock the character's inputs (if in combat they will still be "locked" in the sense it isn't their turn)
  // - if in combat, take ai controlled turn if appropriate
  // CLIENT
  // - end the combatant's turn if in combat and action required turn
  // - set the combatant model's animation manager to translate it back to home position
  // - process next action command if any (ai actions in queue, party wipes, party defeats, equipment swaps initiated during last action)
  changeEquipmentActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void;
  // SERVER
  // - change the appropriate equipment
  // - emit that equipment has changed
  // CLIENT
  // - change the appropriate equipment
  // - remove the loading indicator for that slot
  battleResultActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: BattleResultActionCommandPayload
  ) => void;
  // SERVER
  // - apply exp changes
  // - place items on the ground
  // - if wipe, remove the party from the game
  // - emit wipe messages to other parties in game
  // CLIENT
  // - log the victory and exp changes in the combat log
  // - add any new items to the dungeon room
  // - if defealt log the defeat in the combat log and display the game over message
}
