import { ActionMenuState } from "./index";
import {
  AbilityTreeAbility,
  AbilityType,
  ArrayUtils,
  ClientToServerEvent,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantConditionName,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { COMBAT_ACTION_DESCRIPTIONS } from "../../character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "../../character-sheet/ability-tree/action-description";
import Divider from "@/app/components/atoms/Divider";
import { ACTION_ICONS, TRAIT_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { createCancelButton } from "./common-buttons/cancel";

const allocateAbilityPointHotkey = HOTKEYS.MAIN_1;

export class ConsideringCombatantAbilityMenuState extends ActionMenuState {
  alwaysShowPageOne = true;
  constructor(
    public column: (undefined | AbilityTreeAbility)[],
    public index: number
  ) {
    super(MenuStateType.ConsideringAbilityTreeColumn, index + 1);
    this.minPageCount = column.length;
  }

  getCenterInfoDisplayOption() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

    const abilityOption = AppStore.get().focusStore.combatantAbilities.get().detailed;
    if (abilityOption === null) throw new Error("expected ability missing");

    const conditionsToShowDetailButtonsFor = getConditionsToShowDetailButtonsFor(
      abilityOption,
      focusedCharacter
    );

    const conditionDescriptions = conditionsToShowDetailButtonsFor.map((conditionName) => (
      <div className="" key={conditionName}>
        {COMBATANT_CONDITION_NAME_STRINGS[conditionName]}:{" "}
        {COMBATANT_CONDITION_DESCRIPTIONS[conditionName]}
      </div>
    ));

    let content;
    let iconGetter;

    if (abilityOption.type === AbilityType.Action) {
      const description = COMBAT_ACTION_DESCRIPTIONS[abilityOption.actionName];
      iconGetter = ACTION_ICONS[abilityOption.actionName];
      content = (
        <div className="">
          <div>{description.getSummary()}</div>
          <div>
            Usable {COMBAT_ACTION_USABLITY_CONTEXT_STRINGS[description.getUsabilityContext()]}
          </div>

          {!!conditionDescriptions.length && (
            <div>
              <Divider />
              {conditionDescriptions}
            </div>
          )}
        </div>
      );
    } else {
      iconGetter = TRAIT_ICONS[abilityOption.traitType];
      const description = COMBATANT_TRAIT_DESCRIPTIONS[abilityOption.traitType];
      content = <div>{description.summary}</div>;
    }

    return (
      <div className="h-full w-full border border-slate-400 bg-slate-700 p-2 pointer-events-auto flex flex-col relative">
        {iconGetter &&
          iconGetter(
            "absolute h-full p-6 fill-slate-400 stroke-slate-400 opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        <div className="text-lg">{getAbilityTreeAbilityNameString(abilityOption)}</div>
        <Divider />
        {content}
      </div>
    );
  }

  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        AppStore.get().focusStore.combatantAbilities.clearDetailed();
      })
    );

    const abilityOption = AppStore.get().focusStore.combatantAbilities.get().detailed;
    if (abilityOption === null) throw new Error("expected ability missing");

    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

    const button = new ActionMenuButtonProperties(
      () => (
        <div className="flex justify-between h-full w-full pr-2">
          <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
            Allocate point ({letterFromKeyCode(allocateAbilityPointHotkey)})
          </div>
        </div>
      ),
      "keyname",
      () => {
        websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
          characterId: focusedCharacter.getEntityId(),
          ability: abilityOption,
        });
      }
    );

    button.dedicatedKeys = [allocateAbilityPointHotkey];

    const { combatantProperties } = focusedCharacter;

    const { canAllocate } =
      combatantProperties.abilityProperties.canAllocateAbilityPoint(abilityOption);

    button.shouldBeDisabled = !canAllocate;

    toReturn[ActionButtonCategory.Top].push(button);

    createPageButtons(toReturn, this.column.length, (newPage) => {
      const newDetailedAbilityOption = this.column[newPage - 1] || null;
      if (newDetailedAbilityOption !== null) {
        AppStore.get().focusStore.combatantAbilities.setDetailed(newDetailedAbilityOption);
      } else {
        AppStore.get().focusStore.combatantAbilities.clearDetailed();
      }
    });

    return toReturn;
  }
}

function getConditionsToShowDetailButtonsFor(ability: AbilityTreeAbility, user: Combatant) {
  if (ability.type !== AbilityType.Action) return [];

  const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
  const conditionsToShowDetailButtonsFor: CombatantConditionName[] = [];
  for (const actionRank of ArrayUtils.createFilledWithSequentialNumbers(3, 1)) {
    const rankDescription = description.getDescriptionByLevel(user, actionRank);
    const conditionsAppliedOption = rankDescription[ActionDescriptionComponent.AppliesConditions];
    if (!conditionsAppliedOption) continue;
    for (const conditionBlueprint of conditionsAppliedOption) {
      if (conditionsToShowDetailButtonsFor.includes(conditionBlueprint.conditionName)) continue;
      conditionsToShowDetailButtonsFor.push(conditionBlueprint.conditionName);
    }
  }

  return conditionsToShowDetailButtonsFor;
}
