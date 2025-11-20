import { ActionMenuState } from ".";
import { ClientToServerEvent, CombatActionName } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import { ReactNode } from "react";
import { ActionSelectedDetails } from "../../detailables/action-details/ActionSelectedDetails";
import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client_consts";
import { CycleCombatActionTargetsButtons } from "./common-buttons/CycleCombatActionTargetsButtons";
import { ExecuteCombatActionButton } from "./common-buttons/ExecuteCombatActionButton";
import { CycleTargetingSchemesButtons } from "./common-buttons/CycleTargetingSchemesButtons";

export const executeHotkey = HOTKEYS.MAIN_1;
export const EXECUTE_BUTTON_TEXT = `Execute (${letterFromKeyCode(executeHotkey)})`;

export class ConsideringCombatActionMenuState extends ActionMenuState {
  constructor(public combatActionName: CombatActionName) {
    super(MenuStateType.CombatActionSelected);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const { gameStore } = AppStore.get();
            websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
              characterId: gameStore.getExpectedFocusedCharacterId(),
              actionAndRankOption: null,
            });
          }}
        />
        <ExecuteCombatActionButton />
        <CycleTargetingSchemesButtons />
      </ul>
    );
  }

  getCentralSection(): ReactNode {
    return (
      <div
        className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex"
        style={{ height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem` }}
      >
        <ActionSelectedDetails actionName={this.combatActionName} />
      </div>
    );
  }

  getBottomSection() {
    return <CycleCombatActionTargetsButtons />;
  }
}
