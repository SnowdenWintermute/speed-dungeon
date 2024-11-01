import { ValkeyManager, valkeyManager } from "../kv-store";
import PGTestingContext from "./pg-testing-context";

export default async function setUpTestDatabaseContexts(uniqueTestId: string) {
  const pgContext = await PGTestingContext.build(uniqueTestId);
  console.log("SETTING UP DB CONTEXTS: ", uniqueTestId);
  valkeyManager.context = new ValkeyManager(uniqueTestId);
  await valkeyManager.context.connect();
  return pgContext;
}
