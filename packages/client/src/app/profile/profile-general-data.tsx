import { CombatantClass, ProfileCharacterRanks, SanitizedProfile } from "@speed-dungeon/common";
import React from "react";
import Divider from "../components/atoms/Divider";
import Axe from "../../../public/img/combatant-class-icons/axe.svg";
import DualSwords from "../../../public/img/combatant-class-icons/dual-swords.svg";
import StaffWithSnowflake from "../../../public/img/combatant-class-icons/staff-with-snowflake.svg";

export default async function ProfileGeneralData({ username }: { username: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_GAME_SERVER_URL}/profiles/${username}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
    cache: "no-cache",
  });

  const data: { profile: SanitizedProfile; characterRanks: ProfileCharacterRanks } =
    await res.json();
  if (!data.profile) return <div>No profile...</div>;
  const { profile, characterRanks } = data;

  if (typeof profile.createdAt !== "number") return <div>No profile found</div>;

  const characterRanksArr = Object.entries(characterRanks).sort(
    ([idA, a], [idB, b]) => (a.rank || 0) - (b.rank || 0)
  );

  return (
    <div className="">
      <div className="mb-4">
        <div>Account created {new Date(profile.createdAt).toLocaleDateString()}</div>
        <div>Available character slots: {profile.characterCapacity}</div>
      </div>
      <Divider />
      <h5 className="text-lg mb-2">Saved characters by rank:</h5>
      <div>
        {characterRanksArr.length === 0 && <div>No saved characters...</div>}
        {characterRanksArr.map(([id, character]) => {
          const classIcon = (() => {
            switch (character.class) {
              case CombatantClass.Warrior:
                return <Axe className="h-full w-full fill-slate-400" />;
              case CombatantClass.Mage:
                return (
                  <StaffWithSnowflake className="h-full w-full fill-slate-400 stroke-slate-400" />
                );
              case CombatantClass.Rogue:
                return <DualSwords className="h-full w-full stroke-slate-400 fill-slate-400" />;
            }
          })();

          return (
            <li key={id} className="flex items-center mb-2">
              <span className="h-10 w-10 mr-2">{classIcon}</span>
              <span className="flex justify-between flex-1">
                <span className="w-1/3">{character.name}</span>
                <span className="w-1/3">
                  Rank {typeof character.rank === "number" ? character.rank + 1 : "unranked"}
                </span>
                <span className="w-1/3">Level {character.level}</span>
              </span>
            </li>
          );
        })}
      </div>
    </div>
  );
}
