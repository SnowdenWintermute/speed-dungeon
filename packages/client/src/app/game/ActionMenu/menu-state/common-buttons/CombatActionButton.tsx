import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { getAttackActionIcons } from "@/app/game/character-sheet/ability-tree/action-icons";
import { ACTION_ICONS } from "@/app/icons";
import { BUTTON_HEIGHT } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ActionAndRank,
  ClientToServerEvent,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
  Combatant,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import NumberedButtonHotkeyLabel from "./NumberedButtonHotkeyLabel";

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

  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();
  const party = gameStore.getExpectedParty();

  let isAttack = actionName === CombatActionName.Attack;

  function focusHandler() {
    AppStore.get().actionMenuStore.setHoveredAction(actionName);
  }
  function blurHandler() {
    AppStore.get().actionMenuStore.clearHoveredAction();
  }

  const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

  const useWouldBeError = user.canUseAction({ actionName, rank: 1 }, game, party) instanceof Error;

  const shouldBeDisabled = useWouldBeError || !userControlsThisCharacter;

  const disabledStyles = shouldBeDisabled ? "opacity-50" : "";

  return (
    <HotkeyButton
      onFocus={focusHandler}
      onMouseEnter={focusHandler}
      onBlur={blurHandler}
      onMouseLeave={blurHandler}
      disabled={shouldBeDisabled}
      hotkeys={props.hotkeys}
      className={`w-full flex bg-slate-700 hover:bg-slate-950 border-b border-l border-r border-slate-400`}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={() => {
        websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
          characterId: user.getEntityId(),
          actionAndRankOption: new ActionAndRank(actionName, 1),
        });

        AppStore.get().actionMenuStore.clearHoveredAction();
      }}
    >
      <NumberedButtonHotkeyLabel hotkeyLabel={props.hotkeyLabel} isDisabled={shouldBeDisabled} />
      <div className="flex justify-between h-full w-full pr-2">
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
    </HotkeyButton>
  );
});

const AttackActionIcon = observer(({ user }: { user: Combatant }) => {
  const { combatantProperties } = user;

  const { gameStore } = AppStore.get();
  const party = gameStore.getExpectedParty();
  const inCombat = party.isInCombat();
  let mainHandIcons = [];
  let offHandIcons = [];
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
