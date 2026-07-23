import { Milliseconds } from "@speed-dungeon/common";

// the game server cannot boot until the asset server answers with gameplay facts,
// and nothing guarantees it won the startup race
export const ASSET_FACTS_FETCH_MAX_ATTEMPTS = 5;
export const ASSET_FACTS_FETCH_BASE_DELAY_MS: Milliseconds = 1_000;
