export enum SettingsTab {
  Keybinds,
  Account,
}

export const SETTINGS_TAB_STRINGS: Record<SettingsTab, string> = {
  [SettingsTab.Account]: "Account",
  [SettingsTab.Keybinds]: "Keybinds",
};

export const SETTINGS_TAB_REQUIRES_AUTH: Record<SettingsTab, boolean> = {
  [SettingsTab.Account]: true,
  [SettingsTab.Keybinds]: false,
};
