export enum Jewelry {
  Ring,
  Amulet,
}

export function formatJewelry(jewelry: Jewelry): string {
  switch (jewelry) {
    case Jewelry.Ring:
      return "Ring";
    case Jewelry.Amulet:
      return "Amulet";
  }
}
