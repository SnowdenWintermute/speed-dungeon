import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityUtils,
  ClientIntentType,
  CombatAttribute,
  Combatant,
  EMPTY_ABILITY_TREE,
  EntityName,
  Equipment,
} from "@speed-dungeon/common";
import { ClientApplication } from "..";
import { CharacterSheetSubject } from "./character-sheet-subject";
import { ConsideringItemActionMenuScreen } from "../action-menu/screens/considering-item";
import { ConsideringCombatantAbilityActionMenuScreen } from "../action-menu/screens/ability-tree-ability";
import { ActionMenuScreenType } from "../action-menu/screen-types";

// the sheet as the character's own player sees it: everything the client user is allowed to do goes
// out as an intent, and the action menu follows what is being looked at
export class InGameCharacterSheetSubject extends CharacterSheetSubject {
  constructor(
    private readonly clientApplication: ClientApplication,
    combatant: Combatant
  ) {
    super(combatant);
  }

  getGameOption() {
    return this.clientApplication.gameContext.gameOption;
  }

  getPartyOption() {
    return this.clientApplication.gameContext.partyOption ?? null;
  }

  getEquipmentIsDraggable() {
    return this.clientUserControlsSubject();
  }

  getIsUnownedInPlay() {
    return !this.clientUserControlsSubject();
  }

  getEquipmentSlotClickHandlerOption() {
    if (!this.clientUserControlsSubject()) {
      return null;
    }

    return (item: Equipment) => {
      const { detailableEntityFocus, actionMenu } = this.clientApplication;

      detailableEntityFocus.selectItem(item);
      const detailedItemIsNowNull = detailableEntityFocus.detailables.get().detailed === null;

      const currentMenu = actionMenu.getCurrentMenu();
      if (currentMenu instanceof ConsideringItemActionMenuScreen && detailedItemIsNowNull) {
        return actionMenu.popStack();
      }

      if (currentMenu instanceof ConsideringItemActionMenuScreen) {
        currentMenu.item = item;
      } else {
        actionMenu.pushStack(new ConsideringItemActionMenuScreen(this.clientApplication, item));
      }
    };
  }

  getHotswapSlotSelectionHandlerOption() {
    const { combatantFocus, gameClientRef } = this.clientApplication;
    const characterId = this.combatant.getEntityId();

    if (combatantFocus.disableButtonBecauseNotThisCombatantTurn(characterId)) {
      return null;
    }

    return (slotIndex: number) => {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.SelectHoldableHotswapSlot,
        data: { characterId, slotIndex },
      });
    };
  }

  getAttributeAllocationHandlerOption() {
    if (!this.clientUserControlsSubject()) {
      return null;
    }

    const characterId = this.combatant.getEntityId();
    return (attribute: CombatAttribute) => {
      this.clientApplication.gameClientRef.get()?.dispatchIntent({
        type: ClientIntentType.IncrementAttribute,
        data: { characterId, attribute },
      });
    };
  }

  getAbilityAllocationHandlerOption() {
    if (!this.clientUserControlsSubject()) {
      return null;
    }

    const characterId = this.combatant.getEntityId();
    return (ability: AbilityTreeAbility) => {
      this.clientApplication.gameClientRef.get().dispatchIntent({
        type: ClientIntentType.AllocateAbilityPoint,
        data: { characterId, ability },
      });
    };
  }

  // the menu screen is the ability's column rather than the ability alone, so this has to find which
  // column holds it — including the two support class rows spliced onto the end of each one
  handleAbilitySelected(ability: AbilityTreeAbility) {
    const { actionMenu } = this.clientApplication;
    const columnOption = this.findColumnContaining(ability);
    if (columnOption === null) {
      return;
    }

    if (actionMenu.currentMenuIsType(ActionMenuScreenType.ConsideringAbilityTreeAbility)) {
      actionMenu.popStack();
    }

    actionMenu.pushStack(
      new ConsideringCombatantAbilityActionMenuScreen(this.clientApplication, columnOption, ability)
    );
  }

  getPetRenameHandlerOption() {
    const partyOption = this.getPartyOption();
    if (partyOption === null) {
      return null;
    }

    const { username } = this.clientApplication.gameContext.requireClientPlayer();
    const { controlledBy } = this.combatant.combatantProperties;
    if (!controlledBy.wasSummonedByCharacterControlledByPlayer(username, partyOption)) {
      return null;
    }

    const petId = this.combatant.getEntityId();
    return (newName: EntityName) => {
      this.clientApplication.gameClientRef.get().dispatchIntent({
        type: ClientIntentType.RenamePet,
        data: { petId, newName },
      });
    };
  }

  private clientUserControlsSubject() {
    return this.clientApplication.gameContext.clientUserControlsCombatant(
      this.combatant.getEntityId()
    );
  }

  private findColumnContaining(ability: AbilityTreeAbility): null | AbilityTreeAbility[] {
    const { classProgressionProperties } = this.combatant.combatantProperties;
    const { combatantClass } = classProgressionProperties.getMainClass();
    const supportClassOption = classProgressionProperties.getSupportClassOption();

    const mainTree = ABILITY_TREES[combatantClass];
    const supportTree =
      supportClassOption !== null
        ? ABILITY_TREES[supportClassOption.combatantClass]
        : EMPTY_ABILITY_TREE;

    let columnIndex = -1;
    for (const column of mainTree.columns) {
      columnIndex += 1;
      const withSupportAbilities = [
        ...column,
        ...(supportTree.columns[columnIndex]?.slice(0, 2) ?? []),
      ];

      const holdsAbility = withSupportAbilities.some(
        (abilityToCheck) =>
          abilityToCheck !== undefined && AbilityUtils.abilitiesAreEqual(abilityToCheck, ability)
      );

      if (holdsAbility) {
        return withSupportAbilities.filter(
          (abilityInColumn): abilityInColumn is AbilityTreeAbility => abilityInColumn !== undefined
        );
      }
    }

    return null;
  }
}
