import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantId } from "../../aliases.js";

export function applyExperiencePointChanges(
  party: AdventuringParty,
  experiencePointChanges: Record<CombatantId, number>
) {
  for (const [characterId, expChange] of Object.entries(experiencePointChanges)) {
    const character = party.combatantManager.getExpectedCombatant(characterId);
    character.combatantProperties.classProgressionProperties.experiencePoints.changeExperience(
      expChange
    );
  }
}
