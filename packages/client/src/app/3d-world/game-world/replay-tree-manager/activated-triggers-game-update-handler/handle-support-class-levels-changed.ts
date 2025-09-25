import { AdventuringParty, CombatantClass, CombatantProperties } from "@speed-dungeon/common";

export function handleSupportClassLevelsChanged(
  supportClassLevelsGained: Record<string, CombatantClass>,
  party: AdventuringParty
) {
  for (const [entityId, combatantClass] of Object.entries(supportClassLevelsGained)) {
    const combatantResult = AdventuringParty.getExpectedCombatant(party, entityId);
    const { combatantProperties } = combatantResult;
    CombatantProperties.changeSupportClassLevel(combatantProperties, combatantClass, 1);
  }
}
