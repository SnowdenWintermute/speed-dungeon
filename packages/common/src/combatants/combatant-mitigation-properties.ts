import { instanceToPlain, plainToInstance } from "class-transformer";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
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

    return SHIELD_SIZE_BLOCK_RATE[shieldProperties.size];
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

  getElementalAffinities(): Partial<Record<MagicalElement, number>> {
    const { abilityProperties } = this.getCombatantProperties();
    return abilityProperties.getTraitProperties().inherentElementalAffinities;
  }

  getKineticImpactTypeAffinities(): Partial<Record<KineticDamageType, number>> {
    const { abilityProperties } = this.getCombatantProperties();
    return abilityProperties.getTraitProperties().inherentKineticDamageTypeAffinities;
  }
}
