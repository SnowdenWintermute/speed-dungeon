export enum HeadGear {
  // CLOTH
  Cap,
  Bandana,
  PaddedCap,
  Ribbon,
  WizardHat,
  // LEATHER
  Eyepatch,
  LeatherHat,
  LeatherHelm,
  DemonsaurHelm,
  // MAIL
  Hairpin,
  Skullcap,
  Coif,
  OhmushellMask,
  // PLATE
  Circlet,
  Crown,
  FullHelm,
  GreatHelm,
}

export const HEADGEAR_TYPE_STRINGS: Record<HeadGear, string> = {
  [HeadGear.Cap]: "Cap",
  [HeadGear.Bandana]: "Bandana",
  [HeadGear.PaddedCap]: "Padded Cap",
  [HeadGear.Ribbon]: "Ribbon",
  [HeadGear.WizardHat]: "Wizard Hat",
  [HeadGear.Eyepatch]: "Eyepatch",
  [HeadGear.LeatherHat]: "Leather Hat",
  [HeadGear.LeatherHelm]: "Leather Helm",
  [HeadGear.DemonsaurHelm]: "Demonsaur Helm",
  [HeadGear.Hairpin]: "Hairpin",
  [HeadGear.Skullcap]: "Skullcap",
  [HeadGear.Coif]: "Coif",
  [HeadGear.OhmushellMask]: "Ohmushell Mask",
  [HeadGear.Circlet]: "Circlet",
  [HeadGear.Crown]: "Crown",
  [HeadGear.FullHelm]: "Full Helm",
  [HeadGear.GreatHelm]: "Great Helm",
};
