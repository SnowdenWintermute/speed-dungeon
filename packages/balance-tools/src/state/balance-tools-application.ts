import { autorun, makeAutoObservable } from "mobx";
import { BalanceToolsTab } from "../tabs.ts";
import { AttainableAttributesTabState } from "./attainable-attributes-tab-state.ts";
import {
  isStoredEnumMember,
  isStoredRecord,
  PersistedUiState,
  readPersistedUiState,
  writePersistedUiState,
} from "./persisted-ui-state.ts";
import { StudiesTabState } from "./studies-tab-state.ts";

const PERSIST_DELAY_MILLISECONDS = 250;

/** a run of the tool is a comparison: dial in a study, change a value in code, and read the same
 * table again. changing a value in common is a full recompile and so a full page reload, so every
 * selection lives here and is written to storage rather than in a component the reload discards */
export class BalanceToolsApplication {
  tab = BalanceToolsTab.Studies;
  readonly studies = new StudiesTabState();
  readonly attainableAttributes = new AttainableAttributesTabState();

  constructor() {
    makeAutoObservable(this);
  }

  setTab(tab: BalanceToolsTab) {
    this.tab = tab;
  }

  /** stored selections are applied before anything reacts to them, so a restored selection sets
   * in motion what choosing it would have */
  initialize() {
    this.applySerialized(readPersistedUiState());
    this.studies.initialize();
    // toSerialized reads every persisted field, which is what subscribes this to all of them: a
    // field left out of it is a field that silently stops being written
    autorun(() => writePersistedUiState(this.toSerialized()), {
      delay: PERSIST_DELAY_MILLISECONDS,
    });
  }

  toSerialized(): PersistedUiState {
    return {
      tab: this.tab,
      studies: this.studies.toSerialized(),
      attainableAttributes: this.attainableAttributes.toSerialized(),
    };
  }

  applySerialized(stored: unknown) {
    if (!isStoredRecord(stored)) {
      return;
    }
    if (isStoredEnumMember<BalanceToolsTab>(BalanceToolsTab, stored.tab)) {
      this.tab = stored.tab;
    }
    this.studies.applySerialized(stored.studies);
    this.attainableAttributes.applySerialized(stored.attainableAttributes);
  }
}
