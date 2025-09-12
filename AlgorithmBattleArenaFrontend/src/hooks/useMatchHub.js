import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useMatchHub({ onMatchStarted, onError }) {
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5000/matchhub", {
    accessTokenFactory: () => localStorage.getItem("jwt")
  })
  .withAutomaticReconnect()
  .build();

    connection.on("MatchStarted", onMatchStarted);

    connection
      .start()
      .then(() => setConnected(true))
      .catch(err => {
        setConnected(false);
        if (onError) onError(err);
      });

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [onMatchStarted, onError]);

  const joinLobby = async (lobbyId) => {
    if (!connectionRef.current) return;
    await connectionRef.current.invoke("JoinLobby", lobbyId);
  };

  const leaveLobby = async (lobbyId) => {
    if (!connectionRef.current) return;
    await connectionRef.current.invoke("LeaveLobby", lobbyId);
  };

  const sendPing = async () => {
    if (!connectionRef.current) return null;
    try {
      const start = Date.now();
      await connectionRef.current.invoke("Ping");
      const rtt = Date.now() - start;
      return { rtt };
    } catch (err) {
      if (onError) onError(err);
      return null;
    }
  };

  return { joinLobby, leaveLobby, sendPing, connected };
}
