import {
  Affix,
  AffixGenerator,
  AffixType,
  CombatAttribute,
  Equipment,
  EquipmentRandomizer,
  IdGenerator,
  ItemBuilder,
  OneHandedMeleeWeapon,
  RandomNumberGenerationPolicyFactory,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";

export const totalDexterity = (equipment: Equipment) =>
  equipment.getAffixAttributeValue(AffixType.Dexterity, CombatAttribute.Dexterity);

export const totalStrength = (equipment: Equipment) =>
  equipment.getAffixAttributeValue(AffixType.Strength, CombatAttribute.Strength);

export class EquipmentSolverTestItems {
  private itemBuilder: ItemBuilder;

  constructor(private idGenerator: IdGenerator) {
    const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(0);
    this.itemBuilder = new ItemBuilder(
      new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy))
    );
  }

  private attributeAffix(attribute: CombatAttribute, value: number): Affix {
    return { combatAttributes: { [attribute]: value }, equipmentTraits: {}, tier: 1 };
  }

  dexterityRing(dexterity: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
  }

  strengthRing(strength: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Strength, this.attributeAffix(CombatAttribute.Strength, strength))
      .build(this.idGenerator);
  }

  dexterityAndStrengthRing(dexterity: number, strength: number) {
    return this.itemBuilder
      .ring()
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .suffix(AffixType.Strength, this.attributeAffix(CombatAttribute.Strength, strength))
      .build(this.idGenerator);
  }

  dexterityShortSword(dexterity: number) {
    return this.itemBuilder
      .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
  }

  plainShortSword() {
    return this.itemBuilder
      .oneHandedMeleeWeapon(OneHandedMeleeWeapon.ShortSword)
      .build(this.idGenerator);
  }

  dexterityGreatAxe(dexterity: number) {
    return this.itemBuilder
      .twoHandedMeleeWeapon(TwoHandedMeleeWeapon.GreatAxe)
      .suffix(AffixType.Dexterity, this.attributeAffix(CombatAttribute.Dexterity, dexterity))
      .build(this.idGenerator);
  }
}
