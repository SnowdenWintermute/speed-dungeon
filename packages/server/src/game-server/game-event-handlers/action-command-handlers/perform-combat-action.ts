import {
  AdventuringParty,
  CombatantEquipment,
  CombatantProperties,
  Equipment,
  InputLock,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { applyEquipmentEffectWhileMaintainingResourcePercentages } from "@speed-dungeon/common";
import { COMBAT_ACTIONS } from "@speed-dungeon/common";

export async function performCombatActionActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: PerformCombatActionActionCommandPayload
) {
  const { actionName, hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } = payload;
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party, combatant } = actionAssociatedDataResult;
  const action = COMBAT_ACTIONS[actionName];
  // SERVER
  // - add the "action performance time" to the lockout time
  const actionExecutionTime = action.getExecutionTime();

  InputLock.increaseLockoutDuration(party.inputLock, actionExecutionTime);

  // - apply the hpChange, mpChange, and status effect changes from the payload

  if (mpChangesByEntityId)
    for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      CombatantProperties.changeMana(targetResult.combatantProperties, mpChange);
    }
  if (hpChangesByEntityId)
    for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) return targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      const combatantWasAliveBeforeHpChange = targetCombatantProperties.hitPoints > 0;
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.value);

      if (targetCombatantProperties.hitPoints <= 0)
        SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);

      if (!combatantWasAliveBeforeHpChange && targetCombatantProperties.hitPoints > 0) {
        // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
      }
    }

  // durability changes
  if (payload.durabilityChanges !== undefined) {
    for (const [entityId, durabilitychanges] of Object.entries(payload.durabilityChanges.records)) {
      const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
      if (combatantResult instanceof Error) return combatantResult;
      for (const change of durabilitychanges.changes) {
        const { taggedSlot, value } = change;
        const equipmentOption = CombatantEquipment.getEquipmentInSlot(
          combatantResult.combatantProperties,
          taggedSlot
        );

        applyEquipmentEffectWhileMaintainingResourcePercentages(
          combatantResult.combatantProperties,
          () => {
            if (equipmentOption) Equipment.changeDurability(equipmentOption, value);
          }
        );
      }
    }
  }
}
