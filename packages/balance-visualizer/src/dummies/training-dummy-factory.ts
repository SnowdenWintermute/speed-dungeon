import {
  CombatantBuilder,
  CombatantClass,
  CombatAttribute,
  EntityName,
  EntityProperties,
  Equipment,
  EquipmentType,
  IdGenerator,
  NumberRange,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  Username,
} from "@speed-dungeon/common";
import { getTrainingDummyProfile, TrainingDummyProfile } from "./training-dummy-profile";

export enum TrainingDummyType {
  TwoHandedAttacker,
  DualWieldAttacker,
}

export const TRAINING_DUMMY_TYPE_NAMES: Record<TrainingDummyType, string> = {
  [TrainingDummyType.TwoHandedAttacker]: "two-handed",
  [TrainingDummyType.DualWieldAttacker]: "dual-wield",
};

const DUMMY_PLAYER_NAME = "training-dummy" as Username;

/** Stands in for a monster attacker so the player's defensive stats can be priced without depending
 * on the real spawn tables, which are speculative. Weapons are constructed directly with chosen
 * damage ranges rather than drawn from the equipment templates, the same way
 * generatePreDeterminedItem builds monster gear — so these are tunable without touching
 * game-data.xlsx or coupling to player itemization. */
export class TrainingDummyFactory {
  constructor(private readonly idGenerator: IdGenerator) {}

  build(type: TrainingDummyType, floorNumber: number) {
    return this.fromProfile(type, getTrainingDummyProfile(floorNumber));
  }

  fromProfile(type: TrainingDummyType, profile: TrainingDummyProfile) {
    const builder = CombatantBuilder.playerCharacter(CombatantClass.Warrior, DUMMY_PLAYER_NAME)
      .name(TRAINING_DUMMY_TYPE_NAMES[type])
      .explicitAttributes()
      .attribute(CombatAttribute.Accuracy, profile.accuracy)
      .attribute(CombatAttribute.Hp, profile.hitPoints)
      .attribute(CombatAttribute.ArmorClass, profile.armorClass)
      .attribute(CombatAttribute.Evasion, profile.evasion)
      .attribute(CombatAttribute.Agility, profile.agility)
      .attribute(CombatAttribute.Vitality, profile.vitality);

    this.equipWeapons(builder, type, profile);

    const dummy = builder.build(this.idGenerator);
    dummy.combatantProperties.resources.setToMax();

    return dummy;
  }

  private equipWeapons(
    builder: CombatantBuilder,
    type: TrainingDummyType,
    profile: TrainingDummyProfile
  ) {
    if (type === TrainingDummyType.TwoHandedAttacker) {
      builder.equipMainHand(this.twoHandedWeapon(profile.twoHandedDamage));
      return;
    }

    builder
      .equipMainHand(this.oneHandedWeapon(profile.oneHandedDamage))
      .equipOffHand(this.oneHandedWeapon(profile.oneHandedDamage));
  }

  private twoHandedWeapon(damage: NumberRange) {
    return new Equipment(
      this.weaponEntityProperties("Training Dummy Two-Hander"),
      1,
      {},
      {
        equipmentType: EquipmentType.TwoHandedMeleeWeapon,
        baseItemType: TwoHandedMeleeWeapon.BoStaff,
        damage,
        damageClassification: [],
      },
      null
    );
  }

  private oneHandedWeapon(damage: NumberRange) {
    return new Equipment(
      this.weaponEntityProperties("Training Dummy One-Hander"),
      1,
      {},
      {
        equipmentType: EquipmentType.OneHandedMeleeWeapon,
        baseItemType: OneHandedMeleeWeapon.Club,
        damage,
        damageClassification: [],
      },
      null
    );
  }

  private weaponEntityProperties(name: string): EntityProperties {
    return { name: name as EntityName, id: this.idGenerator.generate() };
  }
}
