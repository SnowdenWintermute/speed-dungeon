import { NormalizedPercentage } from "../../aliases.js";

export const ACTION_DELAY_AT_ONE_SPEED = 1000;
// below 1, each point of speed buys fewer extra turns than the last. turns scale with speed^exponent
export const ACTION_DELAY_SPEED_EXPONENT = 1;
export const BASE_ACTION_DELAY_MULTIPLIER: NormalizedPercentage = 1; // could allow for actions to have greater or lesser delay costs

export const BASE_CONDITION_TICK_SPEED = 10;
export const BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED = 10;
