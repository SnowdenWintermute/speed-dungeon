import { env } from "../validate-env.js";
import { ValkeyManager } from "./valkey-manager.js";

export { ValkeyManager } from "./valkey-manager.js";

export const valkeyManager = { context: new ValkeyManager(env.VALKEY_URL, "") };
