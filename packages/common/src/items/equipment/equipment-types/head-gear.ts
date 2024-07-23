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

export function formatHeadGear(headGear: HeadGear): string {
  switch (headGear) {
    case HeadGear.Cap:
      return "Cap";
    case HeadGear.Bandana:
      return "Bandana";
    case HeadGear.PaddedCap:
      return "Padded Cap";
    case HeadGear.Ribbon:
      return "Ribbon";
    case HeadGear.WizardHat:
      return "Wizard Hat";
    case HeadGear.Eyepatch:
      return "Eyepatch";
    case HeadGear.LeatherHat:
      return "Leather Hat";
    case HeadGear.LeatherHelm:
      return "Leather Helm";
    case HeadGear.DemonsaurHelm:
      return "Demonsaur Helm";
    case HeadGear.Hairpin:
      return "Hairpin";
    case HeadGear.Skullcap:
      return "Skullcap";
    case HeadGear.Coif:
      return "Coif";
    case HeadGear.OhmushellMask:
      return "Ohmushell Mask";
    case HeadGear.Circlet:
      return "Circlet";
    case HeadGear.Crown:
      return "Crown";
    case HeadGear.FullHelm:
      return "Full Helm";
    case HeadGear.GreatHelm:
      return "Great Helm";
  }
}
