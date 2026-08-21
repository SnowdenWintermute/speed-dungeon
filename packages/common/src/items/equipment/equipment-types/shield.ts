export enum Shield {
  PotLid, // small
  CabinetDoor, // small
  Heater, // med
  Buckler, // small
  Pavise, // large
  Aspis, // med
  LanternShield, // small
  KiteShield, // med
  TowerShield, // large
  AncientBuckler, // small
  GothicShield, // med
}

export const SHIELD_TYPE_STRINGS: Record<Shield, string> = {
  [Shield.PotLid]: "Pot Lid",
  [Shield.CabinetDoor]: "Cabinet Door",
  [Shield.Heater]: "Heater",
  [Shield.Buckler]: "Buckler",
  [Shield.Pavise]: "Pavise",
  [Shield.Aspis]: "Aspis",
  [Shield.LanternShield]: "Lantern Shield",
  [Shield.KiteShield]: "Kite Shield",
  [Shield.TowerShield]: "Tower Shield",
  [Shield.AncientBuckler]: "Ancient Buckler",
  [Shield.GothicShield]: "Gothic Shield",
};
