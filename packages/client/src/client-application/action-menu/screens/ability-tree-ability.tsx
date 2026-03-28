import { ActionMenuScreen } from "./index";
import {
  AbilityTreeAbility,
  AbilityType,
  ActionRank,
  AdventuringParty,
  ArrayUtils,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  Combatant,
  COMBATANT_CONDITION_DESCRIPTIONS,
  COMBATANT_CONDITION_NAME_STRINGS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  CombatantConditionName,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { AllocateAbilityPointButton } from "@/app/game/ActionMenu/menu-state/common-buttons/AllocateAbilityPointButton";
import { COMBAT_ACTION_DESCRIPTIONS } from "@/app/game/character-sheet/ability-tree/ability-descriptions";
import { ACTION_ICONS, TRAIT_ICONS } from "@/app/icons";
import Divider from "@/app/components/atoms/Divider";
import { CycleConsideredAbilityInTreeColumnButtons } from "@/app/game/ActionMenu/menu-state/common-buttons/CycleConsideredAbilityInTreeColumnButtons";
import { ActionDescriptionComponent } from "@/app/game/character-sheet/ability-tree/action-description";

export class ConsideringCombatantAbilityActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public column: AbilityTreeAbility[],
    public ability: AbilityTreeAbility
  ) {
    super(clientApplication, ActionMenuScreenType.ConsideringAbilityTreeAbility);
    this.minPageCount = column.length;
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.combatantAbilities.clearDetailed();
          }}
        />
        <AllocateAbilityPointButton ability={this.ability} />
      </ul>
    );
  }

  getCentralSection() {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();

    const conditionsToShowDetailButtonsFor = getConditionsToShowDetailButtonsFor(
      this.clientApplication.gameContext.requireParty(),
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
          {<div>{}</div>}

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

  getBottomSection() {
    return <CycleConsideredAbilityInTreeColumnButtons menuState={this} />;
  }

  setAbility(abilityTreeAbility: AbilityTreeAbility) {
    this.ability = abilityTreeAbility;
  }
}

function getConditionsToShowDetailButtonsFor(
  party: AdventuringParty,
  ability: AbilityTreeAbility,
  user: Combatant
) {
  if (ability.type !== AbilityType.Action) {
    return [];
  }

  const description = COMBAT_ACTION_DESCRIPTIONS[ability.actionName];
  const conditionsToShowDetailButtonsFor: CombatantConditionName[] = [];

  for (const actionRank of ArrayUtils.createFilledWithSequentialNumbers(3, 1)) {
    const rankDescription = description.getDescriptionByLevel(
      user,
      party,
      actionRank as ActionRank
    );
    const conditionsAppliedOption = rankDescription[ActionDescriptionComponent.AppliesConditions];
    if (!conditionsAppliedOption) {
      continue;
    }
    for (const conditionBlueprint of conditionsAppliedOption) {
      if (conditionsToShowDetailButtonsFor.includes(conditionBlueprint.name)) {
        continue;
      }
      conditionsToShowDetailButtonsFor.push(conditionBlueprint.name);
    }
  }

  return conditionsToShowDetailButtonsFor;
}
