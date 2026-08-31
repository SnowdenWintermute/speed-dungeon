import { CombatAttribute } from "../attributes/index.js";
import { CombatantBuilder } from "../combatant-builder.js";
import { MonsterType } from "../attributes/attribute-table-dependencies.js";
import { IdGeneratorRandom } from "../../utility-classes/index.js";
import { invariant } from "../../utils/index.js";
import { MONSTER_ARMOR_CLASS_BY_FLOOR } from "../../monsters/monster-armor-class.generated.js";
import { MONSTER_EVASION_BY_FLOOR } from "../../monsters/monster-evasion.generated.js";

interface TargetDummyOptions {
  /** off is what lets a damage study run before any armor class has been generated from it */
  hasArmorClass: boolean;
}

export class TargetDummyFactory {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });

  constructor(private options: TargetDummyOptions) {}

  private getEvasionOnFloor(floor: number) {
    const evasion = MONSTER_EVASION_BY_FLOOR[floor];
    // const evasion = 0;
    invariant(
      evasion !== undefined,
      `no generated monster evasion for floor ${floor} — run the max accuracy study in balance tools and press "generate monster evasion"`
    );
    return evasion;
  }

  private getArmorClassOnFloor(floor: number) {
    const armorClass = MONSTER_ARMOR_CLASS_BY_FLOOR[floor];
    invariant(
      armorClass !== undefined,
      `no generated monster armor class for floor ${floor} — run a sampled damage study in balance tools and press "generate monster armor class"`
    );
    return armorClass;
  }

  createOnFloor(floor: number) {
    const combatant = CombatantBuilder.monster(MonsterType.Net)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 10000)
      .name("Target Dummy")
      .build(this.idGenerator);

    const { attributeProperties } = combatant.getCombatantProperties();
    attributeProperties.setSpeccedAttributeValue(
      CombatAttribute.Evasion,
      this.getEvasionOnFloor(floor)
    );

    if (this.options.hasArmorClass) {
      attributeProperties.setSpeccedAttributeValue(
        CombatAttribute.ArmorClass,
        this.getArmorClassOnFloor(floor)
      );
    }

    return combatant;
  }
}
