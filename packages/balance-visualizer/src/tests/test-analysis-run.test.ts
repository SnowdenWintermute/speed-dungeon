import { testAnalysisRun } from "./test-analysis-run";

it("runs a mock analysis run", () => {
  for (let i = 0; i < 20; i += 1) {
    expect(() => testAnalysisRun()).not.toThrow();
  }
});
