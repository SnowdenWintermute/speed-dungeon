"use client";
import { CharacterSheetSubject } from "@/client-application/character-sheet/character-sheet-subject";
import { createContext, ReactNode, useContext } from "react";

const CharacterSheetSubjectContext = createContext<CharacterSheetSubject | null>(null);

// every component under here renders one combatant and asks the subject what may be done to them.
// providers nest: the in-game layer provides the focused character, and inspecting somebody else's
// combatant inside it provides that one instead
export function CharacterSheetSubjectProvider({
  subject,
  children,
}: {
  subject: CharacterSheetSubject;
  children: ReactNode;
}) {
  return (
    <CharacterSheetSubjectContext.Provider value={subject}>
      {children}
    </CharacterSheetSubjectContext.Provider>
  );
}

export function useCharacterSheetSubject(): CharacterSheetSubject {
  const value = useContext(CharacterSheetSubjectContext);

  if (!value) {
    throw new Error("no character sheet subject provided");
  }

  return value;
}
