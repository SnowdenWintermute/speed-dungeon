import { CombatAttribute } from "../attributes/index.js";
import { CombatantBuilder } from "../combatant-builder.js";
import { MonsterType } from "../attributes/attribute-table-dependencies.js";
import { IdGeneratorRandom } from "../../utility-classes/index.js";

export class TargetDummyFactory {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });

  private getEvasionOnFloor(floor: number) {
    return 0;
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
