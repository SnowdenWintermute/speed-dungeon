import { useGameStore } from "@/stores/game-store";
import {
  CRAFTING_ACTION_PAST_TENSE_STRINGS,
  CharacterAssociatedData,
  CombatantProperties,
  CraftingAction,
  EntityId,
  Equipment,
  EquipmentType,
  GameMessageType,
  Item,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { plainToInstance } from "class-transformer";
import { setAlert } from "@/app/components/alerts";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  CombatLogMessage,
} from "@/app/game/combat-log/combat-log-message";
import { ReactNode } from "react";
import { ItemLink } from "@/app/game/combat-log/item-link";
import cloneDeep from "lodash.clonedeep";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";

export function characterPerformedCraftingActionHandler(eventData: {
  characterId: EntityId;
  item: Item;
  craftingAction: CraftingAction;
}) {
  const { characterId, item, craftingAction } = eventData;
  let combatLogMessage: CombatLogMessage;

  characterAssociatedDataProvider(characterId, ({ party, character }: CharacterAssociatedData) => {
    const itemResult = CombatantProperties.getOwnedItemById(
      character.combatantProperties,
      item.entityProperties.id
    );
    if (itemResult instanceof Error) return itemResult;

    const itemBeforeModification = cloneDeep(itemResult);
    // distinguish between the crafted and pre-crafted item. used for selecting the item links in the
    // combat log
    itemBeforeModification.craftingIteration !== undefined
      ? (itemBeforeModification.craftingIteration += 1)
      : (itemBeforeModification.craftingIteration = 0);

    if (itemResult instanceof Equipment) {
      const asInstance = plainToInstance(Equipment, item);

      itemResult.copyFrom(asInstance);

      if (shouldUpdateThumbnailAfterCraft(itemResult)) {
        gameWorld.current?.imageManager.enqueueMessage({
          type: ImageManagerRequestType.ItemCreation,
          item: itemResult,
        });
      }

      itemResult.craftingIteration = itemBeforeModification.craftingIteration + 1;

      const actionPrice = getCraftingActionPrice(
        craftingAction,
        Math.min(itemResult.itemLevel, party.currentFloor)
      );
      character.combatantProperties.inventory.shards -= actionPrice;

      // post combat log message about the crafted result with hoverable item inspection link
      const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[GameMessageType.CraftingAction];
      let craftingResultMessage: ReactNode = "";

      const craftedItemLink = <ItemLink item={cloneDeep(itemResult)} />;

      switch (craftingAction) {
        case CraftingAction.Repair:
          break;
        case CraftingAction.Reform:
        case CraftingAction.Shake:
          craftingResultMessage = <div> resulting in {craftedItemLink}</div>;
          break;
        case CraftingAction.Imbue:
        case CraftingAction.Augment:
        case CraftingAction.Tumble:
          craftingResultMessage = <div> and created {craftedItemLink}</div>;
      }

      combatLogMessage = new CombatLogMessage(
        (
          <div>
            {character.entityProperties.name} {CRAFTING_ACTION_PAST_TENSE_STRINGS[craftingAction]}{" "}
            <ItemLink item={itemBeforeModification} />
            {craftingResultMessage}
          </div>
        ),
        style
      );
    } else {
      setAlert("Server sent crafting results of a consumable?");
    }
  });

  useGameStore.getState().mutateState((state) => {
    state.combatLogMessages.push(combatLogMessage);
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
