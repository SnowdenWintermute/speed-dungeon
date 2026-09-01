import { ERROR_MESSAGES } from "../../errors/index.js";
import { invariant, iterateNumericEnum, iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { EntityId, ItemId } from "../../aliases.js";
import { IActionUser } from "../../action-user-context/action-user.js";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionAndRank } from "../../action-user-context/action-user-targeting-properties.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import { EquipmentType } from "../../items/equipment/equipment-types/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { NumericEnumUtils } from "../../utils/numeric-enum-utils.js";
import { Inventory } from "../inventory/index.js";
import { HotswapSlotsManager } from "./hotswap-slot-manager.js";
import { EquipmentSlot } from "./equipment-slot.js";
import {
  COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE,
  EquipmentSlotId,
  HOLDABLE_SLOT_IDS,
  HoldableSlotId,
  WEARABLE_SLOT_IDS,
  WearableSlotId,
} from "./types.js";

export class CombatantEquipment extends CombatantSubsystem implements Serializable, ReactiveNode {
  public readonly staticSlots: Record<WearableSlotId, EquipmentSlot> = {
    [EquipmentSlotId.Head]: new EquipmentSlot(EquipmentSlotId.Head, null),
    [EquipmentSlotId.Body]: new EquipmentSlot(EquipmentSlotId.Body, null),
    [EquipmentSlotId.FingerMain]: new EquipmentSlot(EquipmentSlotId.FingerMain, null),
    [EquipmentSlotId.FingerAlternate]: new EquipmentSlot(EquipmentSlotId.FingerAlternate, null),
    [EquipmentSlotId.Neck]: new EquipmentSlot(EquipmentSlotId.Neck, null),
  };
  public hotswapSlotsManager = new HotswapSlotsManager(() => this.getCombatantProperties());

  makeObservable() {
    makeAutoObservable(this);
    iterateNumericEnumKeyedRecord(this.staticSlots).forEach(([_, equipmentSlot]) =>
      equipmentSlot.makeObservable()
    );
    this.hotswapSlotsManager.makeObservable();
  }

  toSerialized() {
    return {
      staticSlots: NumericEnumUtils.serializeNumericEnumRecord(this.staticSlots),
      hotswapSlotsManager: this.hotswapSlotsManager.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<CombatantEquipment>) {
    const result = new CombatantEquipment();
    for (const slotId of WEARABLE_SLOT_IDS) {
      result.staticSlots[slotId] = EquipmentSlot.fromSerialized(
        slotId,
        serialized.staticSlots[slotId]
      );
    }
    result.hotswapSlotsManager = HotswapSlotsManager.fromSerialized(
      serialized.hotswapSlotsManager,
      () => result.getCombatantProperties()
    );
    return result;
  }

  getSlotById(slotId: EquipmentSlotId): EquipmentSlot {
    if (WEARABLE_SLOT_IDS.includes(slotId as WearableSlotId)) {
      return this.staticSlots[slotId as WearableSlotId];
    } else if (HOLDABLE_SLOT_IDS.includes(slotId as HoldableSlotId)) {
      return this.hotswapSlotsManager.activeSlot.slots[slotId as HoldableSlotId];
    }
    throw new Error("Expected a slot by the passed EquipmentSlotId to exist");
  }

  putEquipmentInSlot(equipmentItem: Equipment, slotId: EquipmentSlotId) {
    const slot = this.getSlotById(slotId);
    invariant(slot.canAcceptEquipmentType(equipmentItem.equipmentBaseItemProperties.equipmentType));
    slot.equipmentInSlot = equipmentItem;
  }

  getAllEquippedItems(options: { includeUnselectedHotswapSlots?: boolean }) {
    const value = this.hotswapSlotsManager.getAllEquipped(options);

    for (const [_slotId, slot] of iterateNumericEnumKeyedRecord(this.staticSlots)) {
      if (slot.equipmentInSlot !== null) {
        value.push(slot.equipmentInSlot);
      }
    }

    return value;
  }

  getEquippedLifestealPercentage(): number {
    let total = 0;
    for (const equippedItem of this.getAllEquippedItems({ includeUnselectedHotswapSlots: false })) {
      total += equippedItem.getLifestealPercentage();
    }
    return total;
  }

  getEquippedNonWeaponFlatDamageBonus(): number {
    let total = 0;
    for (const equippedItem of this.getAllEquippedItems({ includeUnselectedHotswapSlots: false })) {
      // a weapon's own flat damage is applied per-weapon with its percent-damage modifier, so only
      // non-weapon items (ex: the lantern shield's flat damage suffix) are aggregated here
      if (equippedItem.isWeapon()) {
        continue;
      }
      total += equippedItem.getFlatDamageBonus();
    }
    return total;
  }

  getEquipmentInSlot(slotId: EquipmentSlotId) {
    return this.getSlotById(slotId).equipmentInSlot;
  }

  getAllActiveSlots() {
    return [
      ...iterateNumericEnumKeyedRecord(this.hotswapSlotsManager.activeSlot.slots),
      ...iterateNumericEnumKeyedRecord(this.staticSlots),
    ];
  }

  getSlotItemIsEquippedTo(itemId: string): null | { slotId: EquipmentSlotId; slot: EquipmentSlot } {
    for (const [slotId, slot] of this.getAllActiveSlots()) {
      if (slot.equipmentInSlot?.getEntityId() === itemId) {
        return { slotId, slot };
      }
    }

    return null;
  }

  canEquip(equipment: Equipment): { allowed: true } | { allowed: false; reasonCanNot: string } {
    const combatantProperties = this.getCombatantProperties();

    if (!combatantProperties.attributeProperties.hasRequiredAttributesToUseItem(equipment)) {
      return { allowed: false, reasonCanNot: ERROR_MESSAGES.EQUIPMENT.REQUIREMENTS_NOT_MET };
    }
    if (equipment.isBroken()) {
      return { allowed: false, reasonCanNot: ERROR_MESSAGES.EQUIPMENT.IS_BROKEN };
    }
    return { allowed: true };
  }

  equipItem(
    itemId: string,
    equipToAltSlot: boolean
  ): { unequipped: { equipmentId: ItemId; fromSlotId: EquipmentSlotId }[] } {
    const combatantProperties = this.getCombatantProperties();

    const equipmentResult = combatantProperties.inventory.requireEquipmentById(itemId);
    const equipment = equipmentResult;

    const canEquip = this.canEquip(equipment);
    if (canEquip.allowed === false) {
      throw new Error(canEquip.reasonCanNot);
    }

    const removed = combatantProperties.inventory.removeExpectedEquipment(itemId);

    return this.putEquipmentInSlotUnequippingConflicts(removed, equipToAltSlot);
  }

  equipItemFromGround(
    itemId: string,
    groundInventory: Inventory,
    equipToAltSlot: boolean
  ): { unequipped: { equipmentId: ItemId; fromSlotId: EquipmentSlotId }[] } {
    const equipmentResult = groundInventory.requireEquipmentById(itemId);
    const equipment = equipmentResult;

    const canEquip = this.canEquip(equipment);
    if (!canEquip.allowed) {
      throw new Error(canEquip.reasonCanNot);
    }

    const removed = groundInventory.removeExpectedEquipment(itemId);

    return this.putEquipmentInSlotUnequippingConflicts(removed, equipToAltSlot);
  }

  /** Expects the equipment to already have been removed from wherever it came from. */
  private putEquipmentInSlotUnequippingConflicts(
    equipment: Equipment,
    equipToAltSlot: boolean
  ): { unequipped: { equipmentId: ItemId; fromSlotId: EquipmentSlotId }[] } {
    const combatantProperties = this.getCombatantProperties();

    const idsOfUnequippedItems: { equipmentId: ItemId; fromSlotId: EquipmentSlotId }[] = [];
    const { equipmentType } = equipment.equipmentBaseItemProperties;
    const possibleSlots = COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE[equipmentType];

    const destinationSlotId = equipToAltSlot ? possibleSlots.alternate : possibleSlots.main;
    invariant(destinationSlotId !== undefined, "expected destinationSlotId to be defined");

    const slotIdsToUnequip: EquipmentSlotId[] = [destinationSlotId];

    if (destinationSlotId === EquipmentSlotId.MainHand && equipment.isTwoHanded()) {
      slotIdsToUnequip.push(EquipmentSlotId.OffHand);
    }
    if (
      destinationSlotId === EquipmentSlotId.OffHand &&
      this.getEquipmentInSlot(EquipmentSlotId.MainHand)?.isTwoHanded()
    ) {
      slotIdsToUnequip.push(EquipmentSlotId.MainHand);
    }

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      idsOfUnequippedItems.push(...combatantProperties.equipment.unequipSlots(slotIdsToUnequip));

      combatantProperties.equipment.putEquipmentInSlot(equipment, destinationSlotId);
    });

    return { unequipped: idsOfUnequippedItems };
  }

  moveEquippedItemToSlot(
    sourceSlot: EquipmentSlot,
    destinationSlot: EquipmentSlot
  ): { idsOfUnequippedItems: EntityId[] } {
    if (sourceSlot === destinationSlot) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.ALREADY_IN_SLOT);
    }

    const item = sourceSlot.equipmentInSlot;
    if (item === null) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
    }

    const { equipmentType } = item.equipmentBaseItemProperties;
    if (!destinationSlot.canAcceptEquipmentType(equipmentType)) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.CANNOT_GO_IN_SLOT);
    }

    const combatantProperties = this.getCombatantProperties();
    const idsOfUnequippedItems: EntityId[] = [];

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const displacedOption = destinationSlot.removeEquipmentOption();
      sourceSlot.removeExpectedEquipment();
      destinationSlot.equipmentInSlot = item;

      if (displacedOption === null) {
        return;
      }

      const displacedCanSwap = sourceSlot.canAcceptEquipmentType(
        displacedOption.equipmentBaseItemProperties.equipmentType
      );

      if (displacedCanSwap) {
        sourceSlot.equipmentInSlot = displacedOption;
      } else {
        combatantProperties.inventory.insertItem(displacedOption);
        idsOfUnequippedItems.push(displacedOption.entityProperties.id);
      }
    });

    return { idsOfUnequippedItems };
  }

  unequipSlots(slotIds: EquipmentSlotId[]) {
    const unequippedItemIds: { equipmentId: ItemId; fromSlotId: EquipmentSlotId }[] = [];

    const combatantProperties = this.getCombatantProperties();

    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      const unequippedItems = combatantProperties.equipment.removeEquipmentInSlots(slotIds);
      combatantProperties.inventory.equipment.push(
        ...unequippedItems.map((item) => item.equipment)
      );
      unequippedItemIds.push(
        ...unequippedItems.map((item) => {
          return { equipmentId: item.equipment.getEntityId(), fromSlotId: item.slotId };
        })
      );
    });
    return unequippedItemIds;
  }

  unequipAll() {
    this.unequipSlots(iterateNumericEnum(EquipmentSlotId));
  }

  private removeEquipmentInSlots(
    slotIds: EquipmentSlotId[]
  ): { equipment: Equipment; slotId: EquipmentSlotId }[] {
    const unequippedItems: { equipment: Equipment; slotId: EquipmentSlotId }[] = [];

    for (const slotId of slotIds) {
      const slot = this.getSlotById(slotId);
      if (slot.equipmentInSlot) {
        unequippedItems.push({ equipment: slot.equipmentInSlot, slotId: slotId });
        slot.equipmentInSlot = null;
      }
    }

    return unequippedItems;
  }

  removeExpectedItemById(itemId: ItemId) {
    for (const [_slotId, slot] of iterateNumericEnumKeyedRecord(this.staticSlots)) {
      if (slot.equipmentInSlot?.entityProperties.id === itemId) {
        return slot.removeExpectedEquipment();
      }
    }

    const itemInHotswapSlotsOption = this.hotswapSlotsManager.removeItemById(itemId);
    if (itemInHotswapSlotsOption) {
      return itemInHotswapSlotsOption;
    }

    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getEquippedShieldProperties() {
    const offhandOption = this.getEquipmentInSlot(EquipmentSlotId.OffHand);
    if (offhandOption === null) {
      return;
    }
    // equipment.isShield() doesn't narrow the equipmentBaseItemProperties type
    if (offhandOption.equipmentBaseItemProperties.equipmentType !== EquipmentType.Shield) {
      return;
    }
    return offhandOption.equipmentBaseItemProperties;
  }

  private static isHoldingUsableHoldable(
    actionUser: IActionUser,
    slotId: EquipmentSlotId,
    type: EquipmentType
  ): boolean {
    const combatantEquipment = actionUser.getEquipmentOption();
    if (!combatantEquipment) {
      return false;
    }

    const equipmentOption = combatantEquipment.getEquipmentInSlot(slotId);
    if (!equipmentOption) {
      return false;
    }

    if (equipmentOption.equipmentBaseItemProperties.equipmentType !== type) {
      return false;
    }

    const isBroken = equipmentOption.isBroken();
    if (isBroken) {
      return false;
    }

    return actionUser.hasRequiredAttributesToUseItem(equipmentOption);
  }

  isWearingItemWithId(itemId: string) {
    return this.getAllEquippedItems({ includeUnselectedHotswapSlots: true })
      .map((equipment) => equipment.entityProperties.id)
      .includes(itemId);
  }

  static isWearingUsableShield(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(actionUser, EquipmentSlotId.OffHand, EquipmentType.Shield);
  }

  static isWearingUsableTwoHandedRangedWeapon(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(
      actionUser,
      EquipmentSlotId.MainHand,
      EquipmentType.TwoHandedRangedWeapon
    );
  }

  static isWearingUsableTwoHandedMeleeWeapon(actionUser: IActionUser) {
    return this.isHoldingUsableHoldable(
      actionUser,
      EquipmentSlotId.MainHand,
      EquipmentType.TwoHandedMeleeWeapon
    );
  }

  isWearingRequiredEquipmentToUseAction(actionAndRank: ActionAndRank) {
    const { actionName, rank } = actionAndRank;
    const action = COMBAT_ACTIONS[actionName];
    const { getRequiredEquipmentTypeOptions } = action.targetingProperties;
    if (getRequiredEquipmentTypeOptions(rank).length === 0) {
      return true;
    }

    const allEquipment = this.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });

    for (const equipment of allEquipment) {
      const { equipmentType } = equipment.equipmentBaseItemProperties;
      if (equipment.isBroken()) {
        continue;
      }
      if (getRequiredEquipmentTypeOptions(rank).includes(equipmentType)) {
        return true;
      }
    }

    return false;
  }
}
