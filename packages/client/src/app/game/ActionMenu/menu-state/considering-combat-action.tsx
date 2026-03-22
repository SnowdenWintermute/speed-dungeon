import { ActionMenuScreen } from ".";
import { ClientIntentType, CombatActionName } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreenType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import { ReactNode } from "react";
import { ActionSelectedDetails } from "../../detailables/action-details/ActionSelectedDetails";
import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client-consts";
import { CycleCombatActionTargetsButtons } from "./common-buttons/CycleCombatActionTargetsButtons";
import { ExecuteCombatActionButton } from "./common-buttons/ExecuteCombatActionButton";
import { CycleTargetingSchemesButtons } from "./common-buttons/CycleTargetingSchemesButtons";
import { gameClientSingleton } from "@/singletons/lobby-client";

export class ConsideringCombatActionMenuScreen extends ActionMenuScreen {
  constructor(public combatActionName: CombatActionName) {
    super(ActionMenuScreenType.CombatActionSelected);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const { gameStore } = AppStore.get();
            gameClientSingleton.get().dispatchIntent({
              type: ClientIntentType.SelectCombatAction,
              data: {
                characterId: gameStore.getExpectedFocusedCharacterId(),
                actionAndRankOption: null,
              },
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
