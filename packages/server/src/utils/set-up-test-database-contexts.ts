import { ValkeyManager, valkeyManager } from "../kv-store";
import PGTestingContext from "./pg-testing-context";

export default async function setUpTestDatabaseContexts(uniqueTestId: string) {
  console.log("SETTING UP DB CONTEXTS: ", uniqueTestId);
  const pgContext = await PGTestingContext.build(uniqueTestId);
  valkeyManager.context = new ValkeyManager(uniqueTestId);
  await valkeyManager.context.connect();
  return pgContext;
}
