import { attackDamageAnalysisRun } from "@/analysis-runs/attack-damage";

it("runs a mock analysis run", () => {
  const runCount = 100;
  for (let i = 0; i < runCount; i += 1) {
    expect(() => attackDamageAnalysisRun()).not.toThrow();
  }
  // expect(true).toBeTruthy();
});
