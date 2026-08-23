import { testAnalysisRun } from "./test-analysis-run";

it("runs a mock analysis run", () => {
  const runCount = 20;
  for (let i = 0; i < runCount; i += 1) {
    // expect(true).toBeTruthy();
    expect(() => testAnalysisRun()).not.toThrow();
  }
});
