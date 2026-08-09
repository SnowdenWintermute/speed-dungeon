import { describe, expect, it } from "vitest";
import { CombatAttribute } from "@speed-dungeon/common";
import { DominanceProfile, pruneDominated } from "../pareto-prune";

const profileOf = (item: DominanceProfile) => item;

const giving = (benefits: number[], demands: DominanceProfile["demands"] = {}) => ({
  benefits,
  demands,
});

describe("pareto prune", () => {
  it("keeps only the survivor when one gives more on every axis and demands no more", () => {
    const better = giving([10, 10]);
    const worse = giving([4, 2]);

    expect(pruneDominated([better, worse], profileOf)).toEqual([better]);
  });

  it("keeps both when each wins an axis", () => {
    const strong = giving([10, 1]);
    const accurate = giving([1, 10]);

    expect(pruneDominated([strong, accurate], profileOf)).toHaveLength(2);
  });

  it("keeps a weaker option that demands less", () => {
    const demanding = giving([10, 10], { [CombatAttribute.Strength]: 25 });
    const free = giving([4, 2]);

    expect(pruneDominated([demanding, free], profileOf)).toHaveLength(2);
  });

  it("discards a weaker option that also demands more", () => {
    const better = giving([10, 10], { [CombatAttribute.Strength]: 5 });
    const worse = giving([4, 2], { [CombatAttribute.Strength]: 25 });

    expect(pruneDominated([better, worse], profileOf)).toEqual([better]);
  });

  it("collapses duplicates to one survivor", () => {
    expect(pruneDominated([giving([5, 5]), giving([5, 5])], profileOf)).toHaveLength(1);
  });

  it("does not let an early dominated entry survive by arriving first", () => {
    const worse = giving([1, 1]);
    const better = giving([9, 9]);

    expect(pruneDominated([worse, better], profileOf)).toEqual([better]);
  });
});
