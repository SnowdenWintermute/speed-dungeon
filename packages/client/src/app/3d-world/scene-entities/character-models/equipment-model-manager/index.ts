import {
  CombatantEquipment,
  CombatantProperties,
  Equipment,
  EquipmentSlotType,
  HoldableHotswapSlot,
  HoldableSlotType,
  NormalizedPercentage,
  TaggedEquipmentSlot,
  WearableSlotType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ConsumableModel, EquipmentModel } from "../../item-models";
import { CharacterModel } from "../";
import { spawnItemModel } from "@/app/3d-world/item-models/spawn-item-model";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";

type HoldableHotswapSlotsModels = Partial<Record<HoldableSlotType, null | EquipmentModel>>[];

export class EquipmentModelManager {
  wearables: Record<WearableSlotType, null | EquipmentModel> = {
    [WearableSlotType.Head]: null,
    [WearableSlotType.Body]: null,
    [WearableSlotType.RingL]: null,
    [WearableSlotType.RingR]: null,
    [WearableSlotType.Amulet]: null,
  };
  holdableHotswapSlots: HoldableHotswapSlotsModels = [];
  private visibilityForShownHotswapSlots = 0;

  constructor(public characterModel: CharacterModel) {}

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
    const selectedHotswapSlotIndex =
      this.characterModel.getCombatant().combatantProperties.equipment
        .equippedHoldableHotswapSlotIndex;
    const holdableModelsHotswapSlotOption = this.holdableHotswapSlots[selectedHotswapSlotIndex];
    if (!holdableModelsHotswapSlotOption) return undefined;
    return holdableModelsHotswapSlotOption[slot];
  }

  async synchronizeCombatantEquipmentModels() {
    // get the combatant equipment state
    const combatant = this.characterModel.getCombatant();
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
    this.holdableHotswapSlots.forEach((hotswapSlot, i) => {
      for (const [holdableSlotType, equipmentModelOption] of iterateNumericEnumKeyedRecord(
        hotswapSlot
      )) {
        if (!equipmentModelOption) continue;
        const equipmentModelId = equipmentModelOption.entityId;

        const indexAndHoldableSlotIfEquipped =
          CombatantEquipment.getHotswapSlotIndexAndHoldableSlotOfPotentiallyEquippedHoldable(
            combatantProperties,
            equipmentModelId
          );

        // if not in any hotswap slot, dispose it
        if (indexAndHoldableSlotIfEquipped === null) {
          equipmentModelOption.cleanup({ softCleanup: false });
          continue;
        }

        const equipmentIsBroken = Equipment.isBroken(equipmentModelOption.equipment);

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
    const holdableSlots = CombatantEquipment.getHoldableHotswapSlots(combatantProperties);

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

        if (existingModelOption) continue;

        const gameWorld = getGameWorld();
        const equipmentModel = await spawnItemModel(
          holdable,
          gameWorld.scene,
          gameWorld.defaultMaterials,
          true
        );
        if (equipmentModel instanceof Error) throw equipmentModel;
        if (equipmentModel instanceof ConsumableModel) throw new Error("unexpected item type");

        if (Equipment.isBroken(equipmentModel.equipment)) equipmentModel.setVisibility(0);

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

    const hotswapSlots = CombatantEquipment.getHoldableHotswapSlots(combatantProperties);
    const equippedSlotIndex = combatantProperties.equipment.equippedHoldableHotswapSlotIndex;
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
        if (slotIndex === equippedSlotIndex || slotIndex === holsteredSlotIndex) {
          let newVisibility = this.visibilityForShownHotswapSlots;
          if (Equipment.isBroken(equipmentModel.equipment)) newVisibility = 0;
          equipmentModel.setVisibility(newVisibility);
        }

        if (slotIndex === equippedSlotIndex)
          attachHoldableModelToSkeleton(this.characterModel, equipmentModel, holdableSlotType);
        else if (slotIndex === holsteredSlotIndex)
          attachHoldableModelToHolsteredPosition(
            this.characterModel,
            equipmentModel,
            holdableSlotType
          );
        else equipmentModel.setVisibility(0);
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
