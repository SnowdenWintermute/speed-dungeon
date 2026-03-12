import { Item } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ReactNode } from "react";
import { ActionMenuScreen } from "../screens";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { ConfirmShardConversionButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ConfirmShardConversionButton";
import { ConfirmShardConversionDisplay } from "@/app/game/ActionMenu/ConfirmShardConversionDisplay";

export class ConfirmConvertToShardsActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Item,
    // the reason we take the type as an argument is because of the difference
    // between sharding from the inventory (in which case we want to keep viewing the inventory)
    // or the vending machine menu, in which case we choose ActionMenuScreenType.ConfimConvertToShards
    // which doesn't trigger shouldShowCharacterSheet()
    public type: ActionMenuScreenType.ItemSelected | ActionMenuScreenType.ConfimConvertToShards
  ) {
    super(clientApplication, type);
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const shouldDeselectItem = this.type === ActionMenuScreenType.ConfimConvertToShards;
            if (!shouldDeselectItem) return;
            // when operating the vending machine we want to clear the item
            // selection, but not when in inventory
            this.clientApplication.detailableEntityFocus.selectItem(null);
          }}
        />
        <ConfirmShardConversionButton menuState={this} />
      </ul>
    );
  }

  getCentralSection(): ReactNode {
    return <ConfirmShardConversionDisplay />;
  }
}
