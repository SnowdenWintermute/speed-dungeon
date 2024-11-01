import { Application } from "express";
import request, { Agent } from "supertest";
import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";

describe("race game records", () => {
  const testId = Date.now().toString();
  console.log("TESTID: ", testId);
  let pgContext: PGTestingContext;
  let expressApp: Application;
  let agent: Agent;

  beforeAll(async () => {
    pgContext = await setUpTestDatabaseContexts(testId);
    expressApp = createExpressApp();
  });

  beforeEach(async () => {
    await valkeyManager.context.removeAllKeys();
    agent = request.agent(expressApp);
  });

  afterAll(async () => {
    await pgContext.cleanup();
    await valkeyManager.context.cleanup();
  });

  it("does something", () => {
    expect(true).toBeTruthy();
  });
});
