import { ActionMenuButtonProperties } from "./action-menu-button-properties";

export enum ActionButtonCategory {
  Top,
  Numbered,
  Bottom,
  Hidden,
}

export class ActionButtonsByCategory {
  [ActionButtonCategory.Top]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Numbered]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Bottom]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Hidden]: ActionMenuButtonProperties[] = [];

  constructor() {}
}
