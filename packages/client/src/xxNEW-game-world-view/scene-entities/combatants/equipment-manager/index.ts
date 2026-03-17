import {
  CombatantProperties,
  ERROR_MESSAGES,
  EquipmentSlotType,
  HoldableHotswapSlot,
  HoldableSlotType,
  NormalizedPercentage,
  TaggedEquipmentSlot,
  WearableSlotType,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { EquipmentSceneEntity } from "../../items/equipment-scene-entity";
import { CombatantSceneEntity } from "..";
import { ItemSceneEntityFactory } from "../../items/item-scene-entity-factory";

type HoldableHotswapSlotsModels = Partial<Record<HoldableSlotType, null | EquipmentSceneEntity>>[];

export class CombatantSceneEntityEquipmentManager {
  wearables: Record<WearableSlotType, null | EquipmentSceneEntity> = {
    [WearableSlotType.Head]: null,
    [WearableSlotType.Body]: null,
    [WearableSlotType.RingL]: null,
    [WearableSlotType.RingR]: null,
    [WearableSlotType.Amulet]: null,
  };
  holdableHotswapSlots: HoldableHotswapSlotsModels = [];
  private visibilityForShownHotswapSlots = 0;

  constructor(
    public combatantSceneEntity: CombatantSceneEntity,
    private itemSceneEntityFactory: ItemSceneEntityFactory
  ) {}

  getAllModels() {
    const toReturn = [];

    for (const wearableModel of Object.values(this.wearables)) {
      if (wearableModel !== null) toReturn.push(wearableModel);
    }

    for (const holdableHotswapSlot of this.holdableHotswapSlots)
      for (const holdableModel of Object.values(holdableHotswapSlot)) {
        if (holdableModel !== null) toReturn.push(holdableModel);
      }

    return toReturn;
  }

  cleanup() {
    for (const equipmentModel of this.getAllModels())
      equipmentModel.cleanup({ softCleanup: false });
  }

  /** Some hotswap slots may be hidden since we only show two slots but a character may have more that two */
  setVisibilityForShownHotswapSlots(visibility: NormalizedPercentage) {
    this.visibilityForShownHotswapSlots = visibility;
  }

  getEquipmentModelInSlot(slot: TaggedEquipmentSlot) {
    switch (slot.type) {
      case EquipmentSlotType.Holdable:
        return this.getHoldableModelInSlot(slot.slot);
      case EquipmentSlotType.Wearable:
        return this.wearables[slot.slot];
    }
  }

  getHoldableModelInSlot(slot: HoldableSlotType) {
    const { equipment } = this.combatantSceneEntity.combatant.combatantProperties;
    const selectedHotswapSlotIndex = equipment.getSelectedHoldableSlotIndex();
    const holdableModelsHotswapSlotOption = this.holdableHotswapSlots[selectedHotswapSlotIndex];
    if (!holdableModelsHotswapSlotOption) return undefined;
    return holdableModelsHotswapSlotOption[slot];
  }

  requireHoldableModelInSlot(slot: HoldableSlotType) {
    const option = this.getHoldableModelInSlot(slot);
    if (!option) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_EQUIPMENT_MODEL);
    }
    return option;
  }

  async synchronizeCombatantEquipmentModels() {
    // get the combatant equipment state
    const { combatant } = this.combatantSceneEntity;
    const { combatantProperties } = combatant;

    const newState: HoldableHotswapSlotsModels = [];

    this.syncExistingValidModelsWithNewState(newState, combatantProperties);
    await this.spawnNewModelsForNewState(newState, combatantProperties);
    this.applyNewState(newState, combatantProperties);
  }

  private syncExistingValidModelsWithNewState(
    newState: HoldableHotswapSlotsModels,
    combatantProperties: CombatantProperties
  ) {
    this.holdableHotswapSlots.forEach((hotswapSlot) => {
      for (const [_holdableSlotType, equipmentModelOption] of iterateNumericEnumKeyedRecord(
        hotswapSlot
      )) {
        if (!equipmentModelOption) continue;
        const equipmentModelId = equipmentModelOption.entityId;

        const indexAndHoldableSlotIfEquipped =
          combatantProperties.equipment.getHotswapSlotIndexAndHoldableSlotOfPotentiallyEquippedHoldable(
            equipmentModelId
          );

        // if not in any hotswap slot, dispose it
        if (indexAndHoldableSlotIfEquipped === null) {
          equipmentModelOption.cleanup({ softCleanup: false });
          continue;
        }

        const equipmentIsBroken = equipmentModelOption.equipment.isBroken();

        if (equipmentIsBroken) equipmentModelOption.setVisibility(0);
        else equipmentModelOption.setVisibility(this.visibilityForShownHotswapSlots);

        const { slotIndex, holdableSlot } = indexAndHoldableSlotIfEquipped;

        // put it in a temporary new state to later sync with current state
        const existingNewStateSlot = newState[slotIndex];
        if (existingNewStateSlot) existingNewStateSlot[holdableSlot] = equipmentModelOption;
        else newState[slotIndex] = { [holdableSlot]: equipmentModelOption };
      }
    });
  }

  private async spawnNewModelsForNewState(
    newState: HoldableHotswapSlotsModels,
    combatantProperties: CombatantProperties
  ) {
    const holdableSlots = combatantProperties.equipment.getHoldableHotswapSlots();

    let slotIndex = -1;
    for (const hotswapSlot of holdableSlots) {
      slotIndex += 1;

      let existingSlotOption = newState[slotIndex];
      if (existingSlotOption === undefined) {
        existingSlotOption = newState[slotIndex] = {};
      }

      for (const [holdableSlotType, holdable] of iterateNumericEnumKeyedRecord(
        hotswapSlot.holdables
      )) {
        const existingModelOption = existingSlotOption[holdableSlotType];

        if (existingModelOption) {
          continue;
        }

        const equipmentModel = await this.itemSceneEntityFactory.create(holdable, true);
        invariant(equipmentModel instanceof EquipmentSceneEntity, "unexpected item type");

        if (equipmentModel.equipment.isBroken()) {
          equipmentModel.setVisibility(0);
        }

        existingSlotOption[holdableSlotType] = equipmentModel;
      }
    }
  }

  private applyNewState(
    newState: HoldableHotswapSlotsModels,
    combatantProperties: CombatantProperties
  ) {
    this.holdableHotswapSlots = newState;
    // attach to correct positions

    const hotswapSlots = combatantProperties.equipment.getHoldableHotswapSlots();
    const equippedSlotIndex = combatantProperties.equipment.getSelectedHoldableSlotIndex();
    const holsteredSlotIndex = this.getIndexForDisplayedHolsteredSlot(
      hotswapSlots,
      equippedSlotIndex
    );

    let slotIndex = -1;
    for (const hotswapSlot of this.holdableHotswapSlots) {
      slotIndex += 1;
      for (const [holdableSlotType, equipmentModel] of iterateNumericEnumKeyedRecord(hotswapSlot)) {
        if (!equipmentModel) continue;
        // attach to appropriate positions

        if (slotIndex === equippedSlotIndex)
          attachHoldableModelToSkeleton(
            this.combatantSceneEntity,
            equipmentModel,
            holdableSlotType
          );
        else if (slotIndex === holsteredSlotIndex)
          attachHoldableModelToHolsteredPosition(
            this.combatantSceneEntity,
            equipmentModel,
            holdableSlotType
          );

        if (slotIndex === equippedSlotIndex || slotIndex === holsteredSlotIndex) {
          let newVisibility = this.visibilityForShownHotswapSlots;
          if (equipmentModel.equipment.isBroken()) newVisibility = 0;
          equipmentModel.setVisibility(newVisibility);
        } else {
          equipmentModel.setVisibility(0);
        }
      }
    }
  }

  private getIndexForDisplayedHolsteredSlot(
    hotswapSlots: HoldableHotswapSlot[],
    selectedIndex: number
  ): number {
    if (selectedIndex > 1) {
      if (hotswapSlots[1] && Object.entries(hotswapSlots[1].holdables).length) {
        return 1;
      } else {
        return 0;
      }
    } else if (selectedIndex === 1) {
      return 0;
    } else {
      return 1;
    }
  }
}
