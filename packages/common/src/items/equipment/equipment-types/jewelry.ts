export enum Jewelry {
  Ring,
  Amulet,
}

export enum Ring {
  Ring,
}

export enum Amulet {
  Amulet,
}

export function formatRing(ring: Ring) {
  return "Ring";
}

export function formatAmulet(amulet: Amulet) {
  return "Amulet";
}
