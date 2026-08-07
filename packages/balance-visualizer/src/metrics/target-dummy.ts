import {
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  IdGenerator,
  Username,
} from "@speed-dungeon/common";

/** Hit points are absent on purpose: damage per turn is not time to kill. */
export interface TargetDummyStats {
  evasion: number;
  armorClass: number;
  agility: number;
  vitality: number;
}

const DUMMY_PLAYER_NAME = "target-dummy" as Username;
/** Only so the dummy is not dead — getActionHitChance returns zero against a dead target. Not a
 * tuning input, which is why it is not in TargetDummyStats. */
const ENOUGH_HIT_POINTS_TO_BE_ALIVE = 9999;

export class TargetDummy {
  static build(stats: TargetDummyStats, idGenerator: IdGenerator) {
    const dummy = CombatantBuilder.playerCharacter(CombatantClass.Warrior, DUMMY_PLAYER_NAME)
      .name("Target Dummy")
      .explicitAttributes()
      .attribute(CombatAttribute.Hp, ENOUGH_HIT_POINTS_TO_BE_ALIVE)
      .attribute(CombatAttribute.Evasion, stats.evasion)
      .attribute(CombatAttribute.ArmorClass, stats.armorClass)
      .attribute(CombatAttribute.Agility, stats.agility)
      .attribute(CombatAttribute.Vitality, stats.vitality)
      .build(idGenerator);

    dummy.combatantProperties.resources.setToMax();

    return dummy;
  }
}
