// @refresh reset
"use client";
import { useWebsocketStore } from "@/stores/websocket-store";
import { FormEvent, useState } from "react";
import {
  ClientToServerEvent,
  CombatActionType,
  CombatantAbilityName,
  CombatantClass,
} from "@speed-dungeon/common";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { useGameStore } from "@/stores/game-store";

export default function LobbyMenu() {
  const socketOption = useWebsocketStore().socketOption;
  const [gameName, setGameName] = useState("");

  const username = useGameStore().username;
  const firstLetterOfUsername = username ? username.charAt(0) : "?";

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    socketOption?.emit(ClientToServerEvent.CreateGame, gameName);
  }

  function refreshGameList() {
    socketOption?.emit(ClientToServerEvent.RequestsGameList);
  }

  function quickStartGame() {
    socketOption?.emit(ClientToServerEvent.CreateGame, "");
    socketOption?.emit(ClientToServerEvent.CreateParty, "");
    socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
    // socketOption?.emit(ClientToServerEvent.ToggleReadyToExplore);
    // socketOption?.emit(ClientToServerEvent.SelectCombatAction, "1", {
    //   type: CombatActionType.AbilityUsed,
    //   abilityName: CombatantAbilityName.Attack,
    // });
  }

  function quickHost() {
    socketOption?.emit(ClientToServerEvent.CreateGame, "test game");
    socketOption?.emit(ClientToServerEvent.CreateParty, "test party");
    socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Warrior);
  }

  function quickJoin() {
    socketOption?.emit(ClientToServerEvent.RequestsGameList);
    socketOption?.emit(ClientToServerEvent.JoinGame, "test game");
    socketOption?.emit(ClientToServerEvent.JoinParty, "test party");
    socketOption?.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    socketOption?.emit(ClientToServerEvent.ToggleReadyToStartGame);
  }

  return (
    <section className="w-full bg-slate-700 border border-slate-400 p-4 mb-4 flex justify-between pointer-events-auto">
      <div className="flex">
        <form className="flex mr-2" onSubmit={createGame}>
          <input
            className="bg-slate-700 border border-slate-400 h-10 p-4"
            type="text"
            name="game name"
            placeholder="Game name..."
            onChange={(e) => setGameName(e.target.value)}
            value={gameName}
          />
          <ButtonBasic buttonType="submit" extraStyles="border-l-0">
            Create Game
          </ButtonBasic>
          <ButtonBasic onClick={quickStartGame} hotkey={"KeyS"} extraStyles=" text-yellow-400 ml-2">
            Quick Start
          </ButtonBasic>
          <ButtonBasic onClick={quickHost}>Quick Host</ButtonBasic>
          <ButtonBasic onClick={quickJoin}>Quick Join</ButtonBasic>
        </form>
        <ButtonBasic onClick={refreshGameList}>Refresh List</ButtonBasic>
      </div>
      <div className="border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center">
        <span className="text-lg font-bold">{firstLetterOfUsername}</span>
      </div>
    </section>
  );
}
