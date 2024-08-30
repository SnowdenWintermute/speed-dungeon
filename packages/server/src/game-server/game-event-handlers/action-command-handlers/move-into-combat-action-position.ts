import {
  AdventuringParty,
  CombatantProperties,
  MoveIntoCombatActionPositionActionCommandPayload,
} from "@speed-dungeon/common";
import { GameServer } from "../..";
import { Vector3 } from "babylonjs";

export default function moveIntoCombatActionPositionActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: MoveIntoCombatActionPositionActionCommandPayload
) {
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party, combatant } = actionAssociatedDataResult;
  // SERVER
  // - lock this combatant from recieving inputs
  // - if in combat other characters should have their inputs locked already since it isn't their turn
  // - if not in combat, other character's inputs will be processed in order recieved
  CombatantProperties.lockInput(combatant.combatantProperties);
  // - add their travel time to destination to the lockout time
  const { primaryTargetId, isMelee } = payload;
  const primaryTargetResult = AdventuringParty.getCombatant(party, primaryTargetId);
  if (primaryTargetResult instanceof Error) return primaryTargetResult;
  const primaryTarget = primaryTargetResult;

  const destinationLocation = CombatantProperties.getPositionForActionUse(
    combatant.combatantProperties,
    primaryTarget.combatantProperties,
    isMelee
  );

  // - process the next command
}
