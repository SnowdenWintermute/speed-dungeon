import {
  CharacterAssociatedData,
  CraftingAction,
  EntityId,
  Equipment,
  EquipmentType,
  Item,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { plainToInstance } from "class-transformer";
import { setAlert } from "@/app/components/alerts";
import cloneDeep from "lodash.clonedeep";
import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { AppStore } from "@/mobx-stores/app-store";
import { toJS } from "mobx";

export function characterPerformedCraftingActionHandler(eventData: {
  characterId: EntityId;
  item: Item;
  craftingAction: CraftingAction;
}) {
  const { characterId, item, craftingAction } = eventData;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    // used to show loading state so players don't get confused when
    // their craft action produces exact same item as already was
    AppStore.get().actionMenuStore.setCharacterCompletedCrafting(character.getEntityId());

    const itemResult = character.combatantProperties.inventory.getStoredOrEquipped(
      item.entityProperties.id
    );

    if (itemResult instanceof Error) return itemResult;

    const isEquipment = itemResult instanceof Equipment;
    if (!isEquipment) {
      setAlert("Server sent crafting results of a consumable?");
      return;
    }

    console.log("itemResult:", itemResult, "isEquipment:", isEquipment);

    const actionPrice = getCraftingActionPrice(craftingAction, itemResult);
    const itemBeforeModification = cloneDeep(toJS(itemResult));
    // distinguish between the crafted and pre-crafted item. used for selecting the item links in the
    // combat log
    itemBeforeModification.craftingIteration !== undefined
      ? (itemBeforeModification.craftingIteration += 1)
      : (itemBeforeModification.craftingIteration = 0);

    const asInstance = plainToInstance(Equipment, item);

    const wasBrokenBefore = itemResult.isBroken();

    character.combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      itemResult.copyFrom(asInstance);
    });

    const wasRepaired = wasBrokenBefore && !itemResult.isBroken();
    const slotEquippedToOption = character.combatantProperties.equipment.getSlotItemIsEquippedTo(
      itemResult.entityProperties.id
    );
    const isEquipped = slotEquippedToOption !== null;

    if (isEquipped && wasRepaired) {
      getGameWorld().modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantEquipmentModels,
        entityId: character.entityProperties.id,
      });
    }

    if (shouldUpdateThumbnailAfterCraft(itemResult)) {
      gameWorld.current?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ItemCreation,
        item: itemResult,
      });
    }

    itemResult.craftingIteration = itemBeforeModification.craftingIteration + 1;

    character.combatantProperties.inventory.shards -= actionPrice;

    GameLogMessageService.postCraftActionResult(
      character.getName(),
      plainToInstance(Equipment, itemBeforeModification),
      craftingAction,
      itemResult
    );
  });
}

function shouldUpdateThumbnailAfterCraft(equipment: Equipment) {
  // @TODO - instead of checking specific types, we could share the generation template
  // code from the server and check if the template allows for more damage classifications
  // than can be rolled at one time
  if (
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.TwoHandedMeleeWeapon &&
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.baseItemType ===
      TwoHandedMeleeWeapon.ElementalStaff
  ) {
    return true;
  }

  if (
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType ===
      EquipmentType.OneHandedMeleeWeapon &&
    equipment.equipmentBaseItemProperties.taggedBaseEquipment.baseItemType ===
      OneHandedMeleeWeapon.RuneSword
  ) {
    return true;
  }

  return false;
}
