export interface AnalysisRunOptions {
  /** off while deriving requirements, on to see how far having them moves the builds they gate */
  honorsEquipmentRequirements: boolean;
  /**
   * off while deriving armor class, since the dummy has to be unarmored for the damage the
   * derivation reads to be the undiminished damage it assumes
   */
  targetDummiesHaveArmorClass: boolean;
}
