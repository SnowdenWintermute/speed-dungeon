import { Item } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreen } from "./index";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuCentralSection,
  ActionMenuCentralSectionType,
} from "../action-menu-display-data";

export class ConfirmConvertToShardsActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Item,
    public type: ActionMenuScreenType.ItemSelected | ActionMenuScreenType.ConfimConvertToShards
  ) {
    super(clientApplication, type);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            const shouldDeselectItem = this.type === ActionMenuScreenType.ConfimConvertToShards;
            if (!shouldDeselectItem) return;
            this.clientApplication.detailableEntityFocus.selectItem(null);
          },
        },
      },
      {
        type: ActionMenuTopSectionItemType.ConfirmShardConversion,
        data: { item: this.item, screenType: this.type },
      },
    ];
  }

  getCentralSection(): ActionMenuCentralSection {
    return { type: ActionMenuCentralSectionType.ConfirmShardConversion, data: undefined };
  }
}
