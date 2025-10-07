import { AdventuringParty } from "../../adventuring-party/index.js";

export function applyExperiencePointChanges(
  party: AdventuringParty,
  experiencePointChanges: { [combatantId: string]: number }
) {
  for (const [characterId, expChange] of Object.entries(experiencePointChanges)) {
    const character = party.combatantManager.getExpectedCombatant(characterId);
    character.combatantProperties.experiencePoints.current += expChange;
  }
}
