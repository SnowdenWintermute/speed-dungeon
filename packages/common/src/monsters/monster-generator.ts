import { CombatantBuilder } from "../combatants/combatant-builder.js";
import { Combatant } from "../combatants/index.js";
import { ItemBuilder } from "../items/item-creation/item-builder/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { appendMonsterEquipment } from "./append-monster-equipment.js";
import { MONSTER_COMBAT_PROFILES } from "./monster-combat-profiles.js";
import { MONSTER_INHERENT_TRAIT_GETTERS } from "./monster-traits.js";
import { MONSTER_TYPE_STRINGS, MonsterType } from "./monster-types.js";

export class MonsterGenerator {
  constructor(
    private idGenerator: IdGenerator,
    private itemBuilder: ItemBuilder,
    private rng: RandomNumberGenerator
  ) {}

  generate(monsterType: MonsterType, level: number): Combatant {
    const profile = MONSTER_COMBAT_PROFILES[monsterType];

    const builder = CombatantBuilder.monster(monsterType)
      .name(MONSTER_TYPE_STRINGS[monsterType])
      .level(level)
      .aiTypes(profile.aiTypes)
      .withThreatManager();

    for (const action of profile.actions) {
      builder.ownedAction(action.name, action.rank ?? 1);
    }

    const traits = MONSTER_INHERENT_TRAIT_GETTERS[monsterType](level);
    for (const [traitType, rank] of iterateNumericEnumKeyedRecord(traits)) {
      builder.trait(traitType, rank);
    }

    appendMonsterEquipment(builder, monsterType, this.idGenerator, this.itemBuilder, this.rng);

    return builder.build(this.idGenerator);
  }
}
