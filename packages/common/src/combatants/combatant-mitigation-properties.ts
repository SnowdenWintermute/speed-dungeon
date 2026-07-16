import { instanceToPlain, plainToInstance } from "class-transformer";
import {
  calculateBalancedAttributeSynergy,
  iterateNumericEnumKeyedRecord,
} from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { MagicalElement } from "../combat/magical-elements.js";
import { KineticDamageType } from "../combat/kinetic-damage-types.js";
import { CombatantTraitType } from "./combatant-traits/trait-types.js";
import { HoldableSlotType } from "../items/equipment/slots.js";
import { EquipmentType } from "../items/equipment/equipment-types/index.js";
import { Serializable, SerializedOf } from "../serialization/index.js";
import {
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
} from "../items/equipment/equipment-properties/shield-properties.js";
import {
  COUNTERATTACK_TRAIT_CHANCE_BY_RANK,
  PARRY_TRAIT_CHANCE_BY_RANK,
} from "./combatant-traits/index.js";
import { CombatAttribute } from "./attributes/index.js";

export class MitigationProperties extends CombatantSubsystem implements Serializable {
  toSerialized() {
    const result = instanceToPlain(this);
    return result;
  }

  static fromSerialized(serialized: SerializedOf<MitigationProperties>) {
    const result = plainToInstance(MitigationProperties, serialized);
    return result;
  }

  private isPassive() {
    return this.getCombatantProperties()
      .abilityProperties.getTraitProperties()
      .hasTraitType(CombatantTraitType.Passive);
  }

  canParry(): boolean {
    if (this.isPassive()) {
      return false;
    }

    const combatantProperties = this.getCombatantProperties();

    const hasParryTrait = combatantProperties.abilityProperties
      .getTraitProperties()
      .hasTraitType(CombatantTraitType.Parry);

    if (!hasParryTrait) {
      return false;
    }

    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) {
      return false;
    }
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.OffHand) {
        continue;
      }
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (
        equipmentType === EquipmentType.OneHandedMeleeWeapon ||
        equipmentType === EquipmentType.TwoHandedMeleeWeapon
      ) {
        if (equipment.isBroken()) {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  canCounterattack(): boolean {
    if (this.isPassive()) {
      return false;
    }
    return true;
  }

  canBlock(): boolean {
    if (this.isPassive()) {
      return false;
    }

    const combatantProperties = this.getCombatantProperties();
    const holdables = combatantProperties.equipment.getActiveHoldableSlot();
    if (!holdables) return false;
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(holdables.holdables)) {
      if (slot === HoldableSlotType.MainHand) continue;
      const { equipmentType } = equipment.equipmentBaseItemProperties;

      if (equipmentType === EquipmentType.Shield && !equipment.isBroken()) return true;
      // @TODO - move this upward to IActionUser so we can use their method of checking
      // if the shield is usable. Right now we only check it is not broken, but don't
      // check if user has stats required to wield it
    }
    return false;
  }

  getBlockChance() {
    if (!this.canBlock()) {
      return 0;
    }
    const shieldProperties = this.getCombatantProperties().equipment.getEquippedShieldProperties();
    if (shieldProperties === undefined) {
      return 0;
    }

    const baseChance = SHIELD_SIZE_BLOCK_RATE[shieldProperties.size];

    const strength = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    );
    const dexterity = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Dexterity
    );

    const attributeBonusDivisor = 700;
    const attributeBonus = calculateBalancedAttributeSynergy(strength, dexterity);
    const final = baseChance + attributeBonus / attributeBonusDivisor;

    return final;
  }

  getBlockReduction() {
    const shieldPropertiesOption =
      this.getCombatantProperties().equipment.getEquippedShieldProperties();
    if (!shieldPropertiesOption) return 0;

    const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[shieldPropertiesOption.size];

    return baseDamageReduction + shieldPropertiesOption.armorClass / 200;
  }

  getShieldBlockProperties() {
    const blockChance = this.getBlockChance();
    const blockReduction = this.getBlockReduction();
    if (!blockChance || !blockReduction) {
      return undefined;
    }
    return { blockChance, blockReduction };
  }

  getParryChance() {
    if (!this.canParry()) return 0;

    const parryTraitRank = this.getCombatantProperties()
      .abilityProperties.getTraitProperties()
      .getTraitRank(CombatantTraitType.Parry);
    const baseChance = PARRY_TRAIT_CHANCE_BY_RANK.get(parryTraitRank);
    if (baseChance === undefined) {
      return 0;
    }
    const strength = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    );
    const dexterity = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Dexterity
    );
    const attributeBonusDivisor = 1400;
    const attributeBonus = calculateBalancedAttributeSynergy(strength, dexterity);
    const final = baseChance + attributeBonus / attributeBonusDivisor;

    return final;
  }

  getCounterattackChance() {
    const combatantProperties = this.getCombatantProperties();
    if (combatantProperties.isDead()) return 0;
    if (!this.canCounterattack()) return 0;

    const counterattackTraitRank = combatantProperties.abilityProperties
      .getTraitProperties()
      .getTraitRank(CombatantTraitType.Counterattack);

    const baseChance = COUNTERATTACK_TRAIT_CHANCE_BY_RANK.get(counterattackTraitRank);
    if (baseChance === undefined) {
      return 0;
    }

    const strength = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Strength
    );
    const agility = this.getCombatantProperties().attributeProperties.getAttributeValue(
      CombatAttribute.Agility
    );
    const attributeBonusDivisor = 1400;
    const attributeBonus = calculateBalancedAttributeSynergy(strength, agility);
    const final = baseChance + attributeBonus / attributeBonusDivisor;

    return final;
  }

  getElementalAffinities(): Partial<Record<MagicalElement, number>> {
    const { abilityProperties } = this.getCombatantProperties();
    return abilityProperties.getTraitProperties().inherentElementalAffinities;
  }

  getKineticImpactTypeAffinities(): Partial<Record<KineticDamageType, number>> {
    const { abilityProperties } = this.getCombatantProperties();
    return abilityProperties.getTraitProperties().inherentKineticDamageTypeAffinities;
  }
}
