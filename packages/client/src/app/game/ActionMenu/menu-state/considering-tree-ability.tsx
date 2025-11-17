import { ActionMenuState } from "./index";
import {
  AbilityTreeAbility,
  AbilityType,
  ArrayUtils,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantConditionName,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { COMBAT_ACTION_DESCRIPTIONS } from "../../character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "../../character-sheet/ability-tree/action-description";
import Divider from "@/app/components/atoms/Divider";
import { ACTION_ICONS, TRAIT_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ReactNode } from "react";
import GoBackButton from "./common-buttons/GoBackButton";
import { AllocateAbilityPointButton } from "./common-buttons/AllocateAbilityPointButton";
import { CycleConsideredAbilityInTreeColumnButtons } from "./common-buttons/CycleConsideredAbilityInTreeColumnButtons";
import makeAutoObservable from "mobx-store-inheritance";

export class ConsideringCombatantAbilityMenuState extends ActionMenuState {
  constructor(
    public column: AbilityTreeAbility[],
    public ability: AbilityTreeAbility
  ) {
    super(MenuStateType.ConsideringAbilityTreeAbility);
    this.minPageCount = column.length;
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton />
        <AllocateAbilityPointButton ability={this.ability} />
      </ul>
    );
  }

  getNumberedButtons(): ReactNode[] {
    return [];
  }

  getCentralSection() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

    const conditionsToShowDetailButtonsFor = getConditionsToShowDetailButtonsFor(
      this.ability,
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

    const { ability } = this;

    if (ability.type === AbilityType.Action) {
      const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
      iconGetter = ACTION_ICONS[ability.actionName];
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
      iconGetter = TRAIT_ICONS[ability.traitType];
      const description = COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType];
      content = <div>{description.summary}</div>;
    }

    return (
      <div className="h-full w-full border border-slate-400 bg-slate-700 p-2 pointer-events-auto flex flex-col relative">
        {iconGetter &&
          iconGetter(
            "absolute h-full p-6 fill-slate-400 stroke-slate-400 opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        <div className="text-lg">{getAbilityTreeAbilityNameString(ability)}</div>
        <Divider />
        {content}
      </div>
    );
  }

  getBottomSection(): ReactNode {
    return <CycleConsideredAbilityInTreeColumnButtons menuState={this} />;
  }

  setAbility(abilityTreeAbility: AbilityTreeAbility) {
    this.ability = abilityTreeAbility;
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
