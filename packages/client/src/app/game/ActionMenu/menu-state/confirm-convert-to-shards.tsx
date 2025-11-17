import { ActionMenuState } from ".";
import { Item } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import makeAutoObservable from "mobx-store-inheritance";
import { ReactNode } from "react";
import GoBackButton from "./common-buttons/GoBackButton";
import { ConfirmShardConversionDisplay } from "../ConfirmShardConversionDisplay";
import { ConfirmShardConversionButton } from "./common-buttons/ConfirmShardConversionButton";

export class ConfirmConvertToShardsMenuState extends ActionMenuState {
  constructor(
    public item: Item,
    // the reason we take the type as an argument is because of the difference
    // between sharding from the inventory (in which case we want to keep viewing the inventory)
    // or the vending machine menu, in which case we choose MenuStateType.ConfimConvertToShards
    // which doesn't trigger shouldShowCharacterSheet()
    public type: MenuStateType.ItemSelected | MenuStateType.ConfimConvertToShards
  ) {
    super(type);
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            const shouldDeselectItem = this.type === MenuStateType.ConfimConvertToShards;
            if (!shouldDeselectItem) return;
            // when operating the vending machine we want to clear the item
            // selection, but not when in inventory
            AppStore.get().focusStore.selectItem(null);
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
