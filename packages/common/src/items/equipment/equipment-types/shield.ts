export enum Shield {
  MakeshiftBuckler, // small
  WoodenKiteShield, // med
  Buckler, // small
  Pavise, // large
  Aspis, // med
  LanternShield, // small
  KiteShield, // med
  TowerShield, // large
  AncientBuckler, // small
  GothicShield, // med
}

export function formatShield(shield: Shield): string {
  switch (shield) {
    case Shield.MakeshiftBuckler:
      return "Makeshift Buckler";
    case Shield.WoodenKiteShield:
      return "Wooden Kite Shield";
    case Shield.Buckler:
      return "Buckler";
    case Shield.Pavise:
      return "Pavise";
    case Shield.Aspis:
      return "Aspis";
    case Shield.LanternShield:
      return "Lantern Shield";
    case Shield.KiteShield:
      return "Kite Shield";
    case Shield.TowerShield:
      return "Tower Shield";
    case Shield.AncientBuckler:
      return "Ancient Buckler";
    case Shield.GothicShield:
      return "Gothic Shield";
  }
}
