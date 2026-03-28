import { ActionMenuScreen } from ".";
import { ClientIntentType, CombatActionName } from "@speed-dungeon/common";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { ExecuteCombatActionButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ExecuteCombatActionButton";
import { CycleTargetingSchemesButtons } from "@/app/game/ActionMenu/menu-state/common-buttons/CycleTargetingSchemesButtons";
import { ACTION_MENU_CENTRAL_SECTION_HEIGHT } from "@/client-consts";
import { ActionSelectedDetails } from "@/app/game/detailables/action-details/ActionSelectedDetails";
import { CycleCombatActionTargetsButtons } from "@/app/game/ActionMenu/menu-state/common-buttons/CycleCombatActionTargetsButtons";

export class ConsideringCombatActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public combatActionName: CombatActionName
  ) {
    super(clientApplication, ActionMenuScreenType.CombatActionSelected);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.gameClientRef.get().dispatchIntent({
              type: ClientIntentType.SelectCombatAction,
              data: {
                characterId: this.clientApplication.combatantFocus.requireFocusedCharacterId(),
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

  getCentralSection() {
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
