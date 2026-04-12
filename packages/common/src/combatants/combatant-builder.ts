import { Vector3 } from "@babylonjs/core";
import { EntityName } from "../aliases.js";
import { IdGenerator } from "../utility-classes/index.js";
import { Equipment } from "../items/equipment/index.js";
import { Consumable } from "../items/consumables/index.js";
import { CombatAttribute } from "./attributes/index.js";
import { CombatantClass } from "./combatant-class/classes.js";
import { CombatantControlledBy } from "./combatant-controllers.js";
import { CombatantProperties } from "./combatant-properties.js";
import { CombatantSpecies } from "./combatant-species.js";
import { getMonsterCombatantClass, MonsterType } from "../monsters/monster-types.js";
import { MONSTER_SPECIES } from "../monsters/get-monster-combatant-species.js";
import { CombatantControllerType } from "./combatant-controllers.js";
import { Username } from "../aliases.js";
import { AiType } from "../combat/ai-behavior/index.js";
import { Combatant } from "./index.js";
import { CombatantActionState } from "./owned-actions/combatant-action-state.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CombatantTraitType } from "./combatant-traits/trait-types.js";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
  validateEquipmentSlot,
} from "../items/equipment/slots.js";
import { HoldableHotswapSlot } from "./combatant-equipment/holdable-hotswap-slot.js";
import { ThreatManager } from "./threat-manager/index.js";

interface HoldableEquipEntry {
  equipment: Equipment;
  holdableSlot: HoldableSlotType;
  hotswapSlotIndex: number;
}

interface WearableEquipEntry {
  equipment: Equipment;
  wearableSlot: WearableSlotType;
}

export class CombatantBuilder {
  private _name: string = "Test Combatant";
  private _level: number = 1;
  private _species: CombatantSpecies = CombatantSpecies.Humanoid;
  private _monsterType: MonsterType | null = null;
  private _supportClass: { combatantClass: CombatantClass; level: number } | null = null;
  private _speccedAttributes: Partial<Record<CombatAttribute, number>> = {};
  private _holdables: HoldableEquipEntry[] = [];
  private _wearables: WearableEquipEntry[] = [];
  private _inventoryEquipment: Equipment[] = [];
  private _inventoryConsumables: Consumable[] = [];
  private _shards: number = 0;
  private _abilities: CombatantActionState[] = [];
  private _traits: Partial<Record<CombatantTraitType, number>> = {};
  private _aiTypes: AiType[] = [];
  private _withThreatManager: boolean = false;
  private _useExplicitAttributes: boolean = false;

  private constructor(
    private mainClass: CombatantClass,
    private controlledBy: CombatantControlledBy
  ) {}

  static playerCharacter(mainClass: CombatantClass, playerName: Username): CombatantBuilder {
    return new CombatantBuilder(
      mainClass,
      new CombatantControlledBy(CombatantControllerType.Player, playerName)
    );
  }

  static monster(monsterType: MonsterType): CombatantBuilder {
    const builder = new CombatantBuilder(
      getMonsterCombatantClass(monsterType),
      new CombatantControlledBy(CombatantControllerType.Dungeon)
    );
    builder._species = MONSTER_SPECIES[monsterType];
    builder._monsterType = monsterType;
    return builder;
  }

  name(name: string): this {
    this._name = name;
    return this;
  }

  level(level: number): this {
    this._level = level;
    return this;
  }

  species(species: CombatantSpecies): this {
    this._species = species;
    return this;
  }

  monsterType(monsterType: MonsterType): this {
    this._monsterType = monsterType;
    return this;
  }

  aiTypes(aiTypes: AiType[]): this {
    this._aiTypes = aiTypes;
    return this;
  }

  withThreatManager() {
    this._withThreatManager = true;
    return this;
  }

  explicitAttributes(): this {
    this._useExplicitAttributes = true;
    return this;
  }

  supportClass(combatantClass: CombatantClass, level: number): this {
    this._supportClass = { combatantClass, level };
    return this;
  }

  attribute(attribute: CombatAttribute, value: number): this {
    this._speccedAttributes[attribute] = value;
    return this;
  }

  equipMainHand(equipment: Equipment, hotswapSlotIndex: number = 0): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.MainHand,
    });
    this._holdables.push({ equipment, holdableSlot: HoldableSlotType.MainHand, hotswapSlotIndex });
    return this;
  }

  equipOffHand(equipment: Equipment, hotswapSlotIndex: number = 0): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Holdable,
      slot: HoldableSlotType.OffHand,
    });
    this._holdables.push({ equipment, holdableSlot: HoldableSlotType.OffHand, hotswapSlotIndex });
    return this;
  }

  equipHead(equipment: Equipment): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Head,
    });
    this._wearables.push({ equipment, wearableSlot: WearableSlotType.Head });
    return this;
  }

  equipBody(equipment: Equipment): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Body,
    });
    this._wearables.push({ equipment, wearableSlot: WearableSlotType.Body });
    return this;
  }

  equipAmulet(equipment: Equipment): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.Amulet,
    });
    this._wearables.push({ equipment, wearableSlot: WearableSlotType.Amulet });
    return this;
  }

  equipRingL(equipment: Equipment): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.RingL,
    });
    this._wearables.push({ equipment, wearableSlot: WearableSlotType.RingL });
    return this;
  }

  equipRingR(equipment: Equipment): this {
    validateEquipmentSlot(equipment.equipmentBaseItemProperties.equipmentType, {
      type: EquipmentSlotType.Wearable,
      slot: WearableSlotType.RingR,
    });
    this._wearables.push({ equipment, wearableSlot: WearableSlotType.RingR });
    return this;
  }

  addInventoryEquipment(equipment: Equipment): this {
    this._inventoryEquipment.push(equipment);
    return this;
  }

  addInventoryConsumable(consumable: Consumable): this {
    this._inventoryConsumables.push(consumable);
    return this;
  }

  shards(amount: number): this {
    this._shards = amount;
    return this;
  }

  ownedAction(actionName: CombatActionName, rank: number = 1): this {
    this._abilities.push(new CombatantActionState(actionName, rank));
    return this;
  }

  trait(traitType: CombatantTraitType, rank: number = 1): this {
    this._traits[traitType] = rank;
    return this;
  }

  appendAllActions() {
    this.ownedAction(CombatActionName.Attack)
      .ownedAction(CombatActionName.PassTurn)
      .ownedAction(CombatActionName.UseGreenAutoinjector)
      .ownedAction(CombatActionName.UseBlueAutoinjector)
      .ownedAction(CombatActionName.IceBoltParent)
      .ownedAction(CombatActionName.ChainingSplitArrowParent)
      .ownedAction(CombatActionName.SummonPetParent)
      .ownedAction(CombatActionName.DismissPet)
      .ownedAction(CombatActionName.PetCommand)
      .ownedAction(CombatActionName.TamePet)
      .ownedAction(CombatActionName.ReleasePet)
      .ownedAction(CombatActionName.Ensnare)
      .ownedAction(CombatActionName.Fire, 3)
      .ownedAction(CombatActionName.Firewall, 3);
    return this;
  }

  build(idGenerator: IdGenerator): Combatant {
    const id = idGenerator.generate("combatant-builder");
    const entityProperties = { id, name: this._name as EntityName };

    const combatantProperties = new CombatantProperties(
      this.mainClass,
      this._species,
      this._monsterType,
      this.controlledBy,
      Vector3.Zero()
    );

    combatantProperties.classProgressionProperties.getMainClass().level = this._level;

    if (this._supportClass) {
      combatantProperties.classProgressionProperties.setSupportClass(
        this._supportClass.combatantClass,
        this._supportClass.level
      );
    }

    if (this._aiTypes.length > 0) {
      this.controlledBy.setAiTypes(this._aiTypes);
    }

    const combatant = Combatant.createInitialized(entityProperties, combatantProperties);

    if (this._useExplicitAttributes) {
      combatantProperties.attributeProperties.setUseExplicitAttributes();
    }

    for (const [attribute, value] of iterateNumericEnumKeyedRecord(this._speccedAttributes)) {
      combatantProperties.attributeProperties.setSpeccedAttributeValue(attribute, value);
    }

    const hotswapSlots = combatantProperties.equipment.getHoldableHotswapSlots();
    for (const { equipment, holdableSlot, hotswapSlotIndex } of this._holdables) {
      const slot = hotswapSlots[hotswapSlotIndex];
      if (!slot) {
        throw new Error(
          `Hotswap slot index ${hotswapSlotIndex} out of bounds (${hotswapSlots.length} slots available)`
        );
      }
      slot.holdables[holdableSlot] = equipment;
    }

    for (const { equipment, wearableSlot } of this._wearables) {
      combatantProperties.equipment.putEquipmentInSlot(equipment, {
        type: EquipmentSlotType.Wearable,
        slot: wearableSlot,
      });
    }

    combatantProperties.inventory.equipment.push(...this._inventoryEquipment);
    combatantProperties.inventory.consumables.push(...this._inventoryConsumables);
    combatantProperties.inventory.shards = this._shards;

    for (const actionState of this._abilities) {
      combatantProperties.abilityProperties.setOwnedAction(actionState);
    }

    const traitProperties = combatantProperties.abilityProperties.getTraitProperties();
    for (const [traitType, rank] of iterateNumericEnumKeyedRecord(this._traits)) {
      traitProperties.inherentTraitLevels[traitType] = rank;
    }

    // this is a one-off. as far as I know, no other traits have anything so special as to
    // require anything other than an arbitrary number to represent either a value or the level
    // of the trait which would be used in calculations scattered accross the codebase
    if (traitProperties.hasTraitType(CombatantTraitType.ExtraHotswapSlot)) {
      combatantProperties.equipment.addHoldableSlot(new HoldableHotswapSlot());
    }

    combatantProperties.abilityProperties.applyConditionsFromTraits(combatant, idGenerator);
    combatantProperties.resources.setToMax();
    if (this._withThreatManager) {
      combatantProperties.threatManager = new ThreatManager();
    }

    return combatant;
  }
}
