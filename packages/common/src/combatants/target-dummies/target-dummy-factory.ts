import { CombatAttribute } from "../attributes/index.js";
import { CombatantBuilder } from "../combatant-builder.js";
import { MonsterType } from "../attributes/attribute-table-dependencies.js";
import { IdGeneratorRandom } from "../../utility-classes/index.js";
import { invariant } from "../../utils/index.js";
import { MONSTER_EVASION_BY_FLOOR } from "../../monsters/monster-evasion.generated.js";

export class TargetDummyFactory {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });

  private getEvasionOnFloor(floor: number) {
    const evasion = MONSTER_EVASION_BY_FLOOR[floor];
    // const evasion = 0;
    invariant(
      evasion !== undefined,
      `no generated monster evasion for floor ${floor} — run the max accuracy study in the balance visualizer and press "generate monster evasion"`
    );
    return evasion;
  }

  createOnFloor(floor: number) {
    const combatant = CombatantBuilder.monster(MonsterType.Net)
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, 10000)
      .name("Target Dummy")
      .build(this.idGenerator);

    combatant
      .getCombatantProperties()
      .attributeProperties.setSpeccedAttributeValue(
        CombatAttribute.Evasion,
        this.getEvasionOnFloor(floor)
      );

    return combatant;
  }
}
