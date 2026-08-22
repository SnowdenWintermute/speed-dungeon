import { testAnalysisRun } from "./test-analysis-run";

it("runs a mock analysis run", () => {
  for (let i = 0; i < 100; i += 1) {
    expect(() => testAnalysisRun()).not.toThrow();
  }
});
