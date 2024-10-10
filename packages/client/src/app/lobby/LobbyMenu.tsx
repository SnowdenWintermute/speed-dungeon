// @refresh reset
"use client";
import { FormEvent, useState } from "react";
import { ClientToServerEvent, CombatantClass } from "@speed-dungeon/common";
import ButtonBasic from "../components/atoms/ButtonBasic";
import { useGameStore } from "@/stores/game-store";
import { setAlert } from "../components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function LobbyMenu() {
  const [gameName, setGameName] = useState("");
  const mutateAlertStore = useAlertStore().mutateState;

  const username = useGameStore().username;
  const firstLetterOfUsername = username ? username.charAt(0) : "?";

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    websocketConnection.emit(ClientToServerEvent.CreateGame, gameName);
  }

  function refreshGameList() {
    websocketConnection.emit(ClientToServerEvent.RequestsGameList);
  }

  function quickStartGame() {
    websocketConnection.emit(ClientToServerEvent.CreateGame, "");
    websocketConnection.emit(ClientToServerEvent.CreateParty, "");
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Warrior);
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Rogue);
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToStartGame);
    // websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
    // websocketConnection.emit(ClientToServerEvent.SelectCombatAction, "1", {
    //   type: CombatActionType.AbilityUsed,
    //   abilityName: CombatantAbilityName.Attack,
    // });
  }

  function quickHost() {
    websocketConnection.emit(ClientToServerEvent.CreateGame, "test game");
    websocketConnection.emit(ClientToServerEvent.CreateParty, "test party");
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Warrior);
  }

  function quickJoin() {
    websocketConnection.emit(ClientToServerEvent.RequestsGameList);
    websocketConnection.emit(ClientToServerEvent.JoinGame, "test game");
    websocketConnection.emit(ClientToServerEvent.JoinParty, "test party");
    websocketConnection.emit(ClientToServerEvent.CreateCharacter, "", CombatantClass.Mage);
    websocketConnection.emit(ClientToServerEvent.ToggleReadyToStartGame);
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
          {
            <>
              <ButtonBasic
                onClick={async () => {
                  const requestUriResponse = await fetch("http://localhost:8081/oauth/google", {
                    method: "POST",
                    credentials: "include",
                  });
                  const asJson = await requestUriResponse.json();

                  if (typeof asJson.requestUri !== "string") {
                    return setAlert(
                      mutateAlertStore,
                      "Couldn't get the google sign in link from the auth server"
                    );
                  }

                  window.location.href = asJson.requestUri;
                }}
              >
                Google Login
              </ButtonBasic>
              <ButtonBasic onClick={quickHost}>Quick Host</ButtonBasic>
              <ButtonBasic onClick={quickJoin}>Quick Join</ButtonBasic>
            </>
          }
        </form>
        <ButtonBasic onClick={refreshGameList}>Refresh List</ButtonBasic>
      </div>
      <div className="border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center">
        <span className="text-lg font-bold">{firstLetterOfUsername}</span>
      </div>
    </section>
  );
}
