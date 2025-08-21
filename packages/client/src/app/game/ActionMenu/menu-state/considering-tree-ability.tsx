import { immerable } from "immer";
import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { createCancelButton } from "./common-buttons/cancel";
import { setAlert } from "@/app/components/alerts";
import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityType,
  AbilityUtils,
  ClientToServerEvent,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantAbilityProperties,
  CombatantConditionName,
  createArrayFilledWithSequentialNumbers,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import createPageButtons from "./create-page-buttons";
import { websocketConnection } from "@/singletons/websocket-connection";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { COMBAT_ACTION_DESCRIPTIONS } from "../../character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "../../character-sheet/ability-tree/action-description";
import Divider from "@/app/components/atoms/Divider";
import { getAbilityIcon } from "../../icons/get-action-icon";
import { ACTION_ICONS } from "../../character-sheet/ability-tree/action-icons";
import { TRAIT_ICONS } from "../../character-sheet/ability-tree/trait-icons";

const allocateAbilityPointHotkey = HOTKEYS.MAIN_1;

export class ConsideringCombatantAbilityMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ConsideringAbilityTreeAbility;
  alwaysShowPageOne = true;
  constructor(
    public column: (undefined | AbilityTreeAbility)[],
    public index: number
  ) {
    this.page = index + 1;
    this.numPages = column.length;
  }

  getCenterInfoDisplayOption() {
    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return <div>Error getting focused character</div>;
    }

    const abilityOption = useGameStore.getState().detailedCombatantAbility;
    if (abilityOption === null) throw new Error("expected ability missing");

    const conditionsToShowDetailButtonsFor = getConditionsToShowDetailButtonsFor(
      abilityOption,
      focusedCharacterResult
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
        useGameStore.getState().mutateState((state) => {
          state.detailedCombatantAbility = null;
        });
      })
    );

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }

    const abilityOption = useGameStore.getState().detailedCombatantAbility;
    if (abilityOption === null) throw new Error("expected ability missing");

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
          characterId: focusedCharacterResult.entityProperties.id,
          ability: abilityOption,
        });
      }
    );

    button.dedicatedKeys = [allocateAbilityPointHotkey];

    const isMainClassAbility = AbilityUtils.abilityAppearsInTree(
      abilityOption,
      ABILITY_TREES[focusedCharacterResult.combatantProperties.combatantClass]
    );
    const { canAllocate } = CombatantAbilityProperties.canAllocateAbilityPoint(
      focusedCharacterResult.combatantProperties,
      abilityOption,
      !isMainClassAbility
    );

    button.shouldBeDisabled = !canAllocate;

    toReturn[ActionButtonCategory.Top].push(button);

    createPageButtons(this, toReturn, this.column.length, (newPage) => {
      useGameStore.getState().mutateState((state) => {
        state.detailedCombatantAbility = this.column[newPage - 1] || null;
      });
    });

    return toReturn;
  }
}

function getConditionsToShowDetailButtonsFor(ability: AbilityTreeAbility, user: Combatant) {
  if (ability.type !== AbilityType.Action) return [];

  const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
  const conditionsToShowDetailButtonsFor: CombatantConditionName[] = [];
  for (const actionRank of createArrayFilledWithSequentialNumbers(3, 1)) {
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
