import { AdventuringParty, CombatantClass } from "@speed-dungeon/common";

export function handleSupportClassLevelsChanged(
  supportClassLevelsGained: Record<string, CombatantClass>,
  party: AdventuringParty
) {
  for (const [entityId, combatantClass] of Object.entries(supportClassLevelsGained)) {
    const combatantResult = party.combatantManager.getExpectedCombatant(entityId);
    const { combatantProperties } = combatantResult;
    combatantProperties.classProgressionProperties.changeSupportClassLevel(combatantClass, 1);
  }
}
