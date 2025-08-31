import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { randBetween } from "./rand-between.js";

export class ArrayUtils {
  static removeElement<T>(array: T[], element: T): undefined | T {
    const indexToRemove = array.indexOf(element);
    if (indexToRemove !== -1) {
      return array.splice(indexToRemove, 1)[0];
    }
  }

  static shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const toSwap = array[j]!;
      array[j] = array[i]!;
      array[i] = toSwap;
    }
    return array;
  }

  static chooseRandom<T>(arr: T[], rng: RandomNumberGenerator): Error | T {
    if (arr.length < 1) return new Error("Array is empty");
    const randomIndex = randBetween(0, arr.length - 1, rng);
    const randomMember = arr[randomIndex];
    if (randomMember === undefined) return new Error("Somehow randomly chose undefined from array");
    return randomMember;
  }

  static createFilledWithSequentialNumbers(length: number, start: number) {
    return Array.from({ length: length || 0 }, (_, i) => i + start);
  }
}
