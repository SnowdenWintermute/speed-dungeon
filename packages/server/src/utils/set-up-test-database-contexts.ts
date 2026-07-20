import { env } from "../validate-env.js";
import { ValkeyManager, valkeyManager } from "../kv-store/index.js";
import PGTestingContext from "./pg-testing-context.js";

export default async function setUpTestDatabaseContexts(uniqueTestId: string) {
  const pgContext = await PGTestingContext.build(uniqueTestId);
  valkeyManager.context = new ValkeyManager(env.VALKEY_URL, uniqueTestId);
  await valkeyManager.context.connect();
  return pgContext;
}
