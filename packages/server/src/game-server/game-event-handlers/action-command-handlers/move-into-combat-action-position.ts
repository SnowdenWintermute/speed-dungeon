import {
  AdventuringParty,
  COMBATANT_TIME_TO_MOVE_ONE_METER,
  CombatantProperties,
  InputLock,
  MoveIntoCombatActionPositionActionCommandPayload,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import { Vector3 } from "babylonjs";

// SERVER
// - lock this combatant from recieving inputs
// - if in combat other characters should have their inputs locked already since it isn't their turn
// - if not in combat, other character's inputs will be processed in order recieved
// - add their travel time to destination to the lockout time
// - process the next command
export default function moveIntoCombatActionPositionActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: MoveIntoCombatActionPositionActionCommandPayload
) {
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { party, combatant } = actionAssociatedDataResult;
  InputLock.lockInput(combatant.combatantProperties.inputLock);
  const { primaryTargetId, isMelee } = payload;
  const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetId);
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const primaryTarget = primaryTargetResult;

  const { totalTimeToReachDestination } = CombatantProperties.getPositionForActionUse(
    combatant.combatantProperties,
    primaryTarget.combatantProperties,
    isMelee
  );

  InputLock.increaseLockoutDuration(
    combatant.combatantProperties.inputLock,
    totalTimeToReachDestination
  );

  party.actionCommandManager.processNextCommand();
}
