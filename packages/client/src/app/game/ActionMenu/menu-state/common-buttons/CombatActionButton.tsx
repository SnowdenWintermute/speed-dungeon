import { getAttackActionIcons } from "@/app/game/character-sheet/ability-tree/action-icons";
import { ACTION_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  AbilityType,
  ActionAndRank,
  ActionRank,
  ClientIntentType,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
  Combatant,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import { ActionMenuNumberedButton } from "./ActionMenuNumberedButton";

interface Props {
  actionName: CombatActionName;
  user: Combatant;
  hotkeys: string[];
  hotkeyLabel: string;
}

export const CombatActionButton = observer((props: Props) => {
  const { actionName, user } = props;
  const nameAsString = COMBAT_ACTION_NAME_STRINGS[actionName];
  const standardActionIcon = ACTION_ICONS[actionName];

  const clientApplication = useClientApplication();
  const { gameContext, gameClientRef, combatantFocus, detailableEntityFocus } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();

  const isAttack = actionName === CombatActionName.Attack;

  function focusHandler() {
    detailableEntityFocus.combatantAbilities.setHovered({
      type: AbilityType.Action,
      actionName,
    });
  }
  function blurHandler() {
    detailableEntityFocus.combatantAbilities.clearHovered();
  }

  const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

  const useWouldBeError =
    user.canUseAction(new ActionAndRank(actionName, 1 as ActionRank), game, party) instanceof Error;

  const shouldBeDisabled = useWouldBeError || !userControlsThisCharacter;

  const disabledStyles = shouldBeDisabled ? "opacity-50" : "";

  return (
    <ActionMenuNumberedButton
      focusHandler={focusHandler}
      blurHandler={blurHandler}
      disabled={shouldBeDisabled}
      hotkeys={props.hotkeys}
      hotkeyLabel={props.hotkeyLabel}
      clickHandler={() => {
        gameClientRef.get().dispatchIntent({
          type: ClientIntentType.SelectCombatAction,
          data: {
            characterId: user.getEntityId(),
            actionAndRankOption: new ActionAndRank(actionName, 1 as ActionRank),
          },
        });

        detailableEntityFocus.combatantAbilities.clear();
      }}
    >
      <div className="flex justify-between h-full w-full px-2">
        <div
          className={`${disabledStyles} flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1`}
        >
          {nameAsString}
        </div>
        <div className={`${disabledStyles} h-full flex items-center p-2`}>
          {isAttack && <AttackActionIcon user={user} />}{" "}
          {!isAttack && (
            <div className="h-full">
              {standardActionIcon === null
                ? "icon missing"
                : standardActionIcon("h-full fill-slate-400 stroke-slate-400")}{" "}
            </div>
          )}
        </div>
      </div>
    </ActionMenuNumberedButton>
  );
});

const AttackActionIcon = observer(({ user }: { user: Combatant }) => {
  const { combatantProperties } = user;
  const clientApplication = useClientApplication();
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  const inCombat = party.isInCombat();
  const mainHandIcons = [];
  const offHandIcons = [];
  let ohDisabledStyle = "";

  const { mhIcons, ohIcons, ohDisabled } = getAttackActionIcons(combatantProperties, inCombat);
  mainHandIcons.push(...mhIcons);
  offHandIcons.push(...ohIcons);
  if (ohDisabled) ohDisabledStyle = "opacity-50";

  return (
    <div className="h-full flex">
      <div className="h-full flex">
        {mainHandIcons.map((iconGetter, i) => (
          <div key={"mh-" + i} className="h-full mr-1 last:mr-0">
            {iconGetter("h-full fill-slate-400 stroke-slate-400")}
          </div>
        ))}
      </div>
      {!!(offHandIcons.length > 0) && <div className="mx-1">/</div>}

      <div className={"h-full flex"}>
        {offHandIcons.map((iconGetter, i) => (
          <div key={"mh-" + i} className={`h-full mr-1 last:mr-0 ${ohDisabledStyle}`}>
            {iconGetter("h-full fill-slate-400 stroke-slate-400")}
          </div>
        ))}
      </div>
    </div>
  );
});
