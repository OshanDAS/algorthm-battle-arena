import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export default function LobbyPage() {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState("disconnected");
  const [lobbies, setLobbies] = useState([]);
  const [events, setEvents] = useState([]);

  // Get JWT from localStorage
  const token = localStorage.getItem("jwt");

  // Append events to log
  const logEvent = (message) => {
    setEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Fetch lobbies with Authorization header
  async function fetchLobbies() {
    try {
      const response = await fetch("http://localhost:5000/api/lobbies", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lobbies");
      }

      const data = await response.json();
      setLobbies(data);
      logEvent("Fetched lobbies successfully");
    } catch (err) {
      console.error("Fetch lobbies failed:", err.message);
      logEvent(`Fetch lobbies failed: ${err.message}`);
    }
  }

  // Setup SignalR connection
  useEffect(() => {
    if (!token) {
      logEvent("No JWT token found. Redirect to login.");
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/lobbyHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [token]);

  // Start connection and set up handlers
  useEffect(() => {
    if (!connection) return;

    async function startConnection() {
      try {
        await connection.start();
        setConnectionState("connected");
        logEvent("SignalR: connected");

        // Example: handle lobby updates from backend
        connection.on("LobbyUpdated", (lobby) => {
          logEvent(`Lobby updated: ${JSON.stringify(lobby)}`);
        });

        // Fetch initial lobby list after connection
        fetchLobbies();
      } catch (err) {
        console.error("SignalR connection failed:", err);
        logEvent(`SignalR connection failed: ${err.message}`);
      }
    }

    startConnection();

    connection.onclose(() => {
      setConnectionState("disconnected");
      logEvent("SignalR: disconnected");
    });
  }, [connection]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    window.location.href = "/login";
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Lobby</h1>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Connection: {connectionState}</h2>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Lobbies</h2>
        {lobbies.length === 0 ? (
          <p>No lobbies available</p>
        ) : (
          <ul className="list-disc pl-6">
            {lobbies.map((lobby, idx) => (
              <li key={idx}>{lobby.name || `Lobby ${idx + 1}`}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Events</h2>
        <div className="bg-gray-100 p-2 rounded h-48 overflow-y-auto text-sm">
          {events.map((e, idx) => (
            <div key={idx}>{e}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
