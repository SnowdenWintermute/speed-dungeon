import { ACTION_MENU_PAGE_SIZE } from "@/client-application/action-menu/consts";

export const CHARACTER_SLOT_SPACING = 1;

export const WEBSITE_NAME = "Speed Dungeon";
export const BUTTON_HEIGHT_SMALL = 1.875;
export const BUTTON_HEIGHT = 2.5;
export const ACTION_MENU_CENTRAL_SECTION_HEIGHT = BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE;
export const SPACING_REM = 0.875;
export const SPACING_REM_SMALL = 0.625;
export const SPACING_REM_LARGE = 1.563;
export const TOP_BAR_HEIGHT_REM = 3.75;

export const COMBATANT_PLAQUE_RESOURCE_BAR_HEIGHT = "h-3.5";

// pointer travel (px) before a press on an item becomes a drag rather than a click
export const DRAG_START_THRESHOLD_PX = 5;

// item drag-and-drop highlight styles (keep these class strings in tailwind.config safelist —
// this file is outside the tailwind content globs)
export const DRAG_VALID_BORDER = "border-zinc-300";
export const DRAG_VALID_BORDER_HOVERED = "border-white";
export const DRAG_BLOCKED_BORDER = "border-red-400";
export const DRAG_BLOCKED_BORDER_HOVERED = "border-red-400";
export const DRAG_VALID_BG = "bg-slate-700";
export const DRAG_VALID_BG_HOVERED = "bg-slate-700";
// applied as an inline style (not a tailwind class) so it doesn't depend on the safelist
export const DRAG_SOURCE_DRAGGING_OPACITY = 0.4;

export const UNMET_REQUIREMENT_TEXT_COLOR = "text-red-400";
export const UNMET_REQUIREMENT_COLOR = "#f87171";
export const WARNING_COLOR = "#facc15";
export const WARNING_COLOR_DARK = "#eab308";
export const MAIN_TEXT_AND_BORDERS_COLOR = "#94a3b8";
export const MAIN_BG_COLOR = "#334155";
export const MAIN_ACCENT_COLOR = "#020617";
export const HP_COLOR = "#15803d";

export const HTTP_REQUEST_NAMES = {
  GET_SESSION: "get session",
  LOGIN_WITH_CREDENTIALS: "login with credentials",
  SIGN_UP_WITH_CREDENTIALS: "sign up with credentials",
  ACTIVATE_ACCOUNT: "activate account",
  PASSWORD_RESET_EMAIL: "get password reset email",
  CHANGE_PASSWORD: "change password",
  DELETE_ACCOUNT: "delete account",
  CHANGE_USERNAME: "change username",
  LEVEL_LADDER: "level ladder",
  GET_USER_GAME_HISTORY: "get user game history",
  GET_USER_NUM_GAMES_PLAYED: "get user num games played",
};
