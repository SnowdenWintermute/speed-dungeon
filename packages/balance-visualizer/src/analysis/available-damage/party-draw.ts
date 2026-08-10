import { CombatantClass, invariant } from "@speed-dungeon/common";
import {
  ArchetypeProfile,
  CHARACTER_ARCHETYPES,
  CharacterArchetype,
} from "../character-archetype";

export interface DrawnMember {
  archetype: CharacterArchetype;
  combatantClass: CombatantClass;
  profile: ArchetypeProfile;
}

/** Three archetypes per run, drawn without replacement so no party ever doubles up, with the class
 * rolled inside whatever the archetype allows. Re-drawn every run, so an archetype's figures are an
 * average over the teammates it could have had rather than over one fixed party. */
export class ArchetypeParty {
  static draw(
    size: number,
    profiles: Record<CharacterArchetype, ArchetypeProfile>,
    roll: () => number
  ): DrawnMember[] {
    invariant(
      size <= CHARACTER_ARCHETYPES.length,
      "cannot draw more archetypes than exist without repeating one"
    );

    const remaining = [...CHARACTER_ARCHETYPES];
    const drawn: DrawnMember[] = [];

    for (let member = 0; member < size; member += 1) {
      const [archetype] = remaining.splice(Math.floor(roll() * remaining.length), 1);
      invariant(archetype !== undefined, "drew from an empty archetype pool");

      const profile = profiles[archetype];
      const combatantClass = profile.allowedClasses[Math.floor(roll() * profile.allowedClasses.length)];
      invariant(combatantClass !== undefined, "an archetype allows no classes");

      drawn.push({ archetype, combatantClass, profile });
    }

    return drawn;
  }
}
