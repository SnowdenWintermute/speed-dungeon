import { Milliseconds, NormalizedPercentage } from "../../primatives";

// DELAY BASED
export const SPEED_DELAY_RECOVERY_WEIGHT = 50;
export const BASE_ACTION_DELAY: Milliseconds = 1000;
export const BASE_ACTION_DELAY_MULTIPLIER: NormalizedPercentage = 1; // could allow for actions to have greater or lesser delay costs

export const BASE_CONDITION_TICK_SPEED = 10;
export const BASE_PERSISTENT_ACTION_ENTITY_TICK_SPEED = 10;
