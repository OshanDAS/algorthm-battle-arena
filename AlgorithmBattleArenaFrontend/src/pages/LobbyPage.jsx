"use client"

import React, { useEffect, useRef, useState } from "react"
import * as signalR from "@microsoft/signalr"
import { useNavigate } from "react-router-dom"
import { BookOpen, Users, Shield, CheckCircle } from "lucide-react"

/**
 * LobbyPage (fixed)
 * - Reads token reactively from localStorage (state + storage event)
 * - Uses the current token when fetching or connecting
 * - Shows clear CTA to sign in when no token
 * - Enables SignalR client logging for debugging
 */

export default function LobbyPage() {
  const navigate = useNavigate()
  const connectionRef = useRef(null)

  // reactive token: read initially from localStorage, update when storage changes
  const [token, setToken] = useState(() => localStorage.getItem("jwt"))

  const [connectionState, setConnectionState] = useState("disconnected")
  const [isFetchingLobbies, setIsFetchingLobbies] = useState(false)
  const [lobbies, setLobbies] = useState([])
  const [events, setEvents] = useState([])
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    // keep token in sync if another tab logs in/out
    const handleStorage = (e) => {
      if (e.key === "jwt") setToken(e.newValue)
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const logEvent = (message) => {
    const time = new Date().toLocaleTimeString()
    setEvents((prev) => [...prev, `${time}: ${message}`])
  }

  // Use fresh token on every call (fallback to state)
  const getToken = () => localStorage.getItem("jwt") || token

  async function fetchLobbies() {
    const currentToken = getToken()
    if (!currentToken) {
      logEvent("Cannot fetch lobbies: no token")
      setStatusMessage("Not authenticated")
      return
    }

    setIsFetchingLobbies(true)
    setStatusMessage("Fetching lobbies...")

    try {
      const res = await fetch("http://localhost:5000/api/Lobbies", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status} - ${body}`)
      }

      const data = await res.json()
      setLobbies(data || [])
      logEvent("Fetched lobbies successfully")
      setStatusMessage("Lobbies loaded")
    } catch (err) {
      console.error("fetchLobbies error:", err)
      logEvent(`Fetch lobbies failed: ${err.message}`)
      setStatusMessage("Failed to load lobbies")
    } finally {
      setIsFetchingLobbies(false)
    }
  }

  // Start SignalR connection using the latest token
  const startConnection = async () => {
    const currentToken = getToken()
    if (!currentToken) {
      logEvent("No JWT token found. Click Sign in.")
      setStatusMessage("Not authenticated")
      return
    }

    if (connectionRef.current) {
      try {
        await connectionRef.current.stop()
      } catch (_) {}
      connectionRef.current = null
    }

    setConnectionState("connecting")
    setStatusMessage("Connecting to lobby hub...")
    logEvent("Starting SignalR connection...")

    const hub = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/lobbyHub", {
        accessTokenFactory: () => currentToken,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information) // <-- enable client logging
      .build()

    // handlers
    hub.on("LobbyUpdated", (lobby) => {
      logEvent(`LobbyUpdated: ${JSON.stringify(lobby)}`)
      setLobbies((prev) => {
        const idx = prev.findIndex((x) => x?.id === lobby?.id)
        if (idx === -1) return [lobby, ...prev]
        const copy = [...prev]
        copy[idx] = lobby
        return copy
      })
    })

    hub.on("LobbyCreated", (lobby) => {
      logEvent(`LobbyCreated: ${JSON.stringify(lobby)}`)
      setLobbies((prev) => [lobby, ...prev])
    })

    hub.onclose((err) => {
      setConnectionState("disconnected")
      logEvent("SignalR: disconnected")
      if (err) {
        console.error("SignalR closed with error:", err)
        logEvent(`SignalR closed: ${err?.message || err}`)
      }
      setStatusMessage("Disconnected from hub")
      connectionRef.current = null
    })

    try {
      await hub.start()
      connectionRef.current = hub
      setConnectionState("connected")
      setStatusMessage("Connected")
      logEvent("SignalR: connected")
      // fetch lobbies after successful connect (authorized)
      fetchLobbies()
    } catch (err) {
      console.error("SignalR connection failed:", err)
      setConnectionState("disconnected")
      setStatusMessage("Connection failed")
      logEvent(`SignalR connection failed: ${err?.message || err}`)
    }
  }

  const stopConnection = async () => {
    const hub = connectionRef.current
    if (!hub) {
      setConnectionState("disconnected")
      setStatusMessage("No active connection")
      return
    }

    setConnectionState("disconnecting")
    setStatusMessage("Disconnecting...")
    logEvent("Stopping SignalR connection...")

    try {
      await hub.stop()
      connectionRef.current = null
      setConnectionState("disconnected")
      setStatusMessage("Disconnected")
      logEvent("SignalR: stopped")
    } catch (err) {
      console.error("Error stopping connection:", err)
      setStatusMessage("Error while disconnecting")
      logEvent(`Error on disconnect: ${err?.message || err}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("jwt")
    setToken(null)
    // if connected, stop connection
    if (connectionRef.current) stopConnection().catch(() => {})
    navigate("/login")
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 relative">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center">
          <div className="hidden lg:block space-y-8 xl:space-y-12">
            <div className="text-left">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-6 leading-tight">Multiplayer Lobby</h1>
              <p className="text-gray-600 text-lg xl:text-xl leading-relaxed mb-8">
                Live multiplayer lobbies — authenticate first, then connect.
              </p>

              <div className="space-y-4 xl:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-time updates</h3>
                    <p className="text-gray-600 text-sm">SignalR pushes lobby events instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Multiplayer Lobby</h1>
              <p className="text-gray-600 text-sm sm:text-base">Connect to the hub and join a match</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6 sm:space-y-8 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Connection</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        connectionState === "connected"
                          ? "text-emerald-600"
                          : connectionState === "connecting"
                          ? "text-amber-600"
                          : "text-gray-600"
                      }`}
                    >
                      {connectionState}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={startConnection}
                    disabled={connectionState === "connecting" || connectionState === "connected"}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform ${
                      connectionState === "connected"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105"
                    }`}
                  >
                    {connectionState === "connecting" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 inline-block mr-2" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={stopConnection}
                    disabled={connectionState !== "connected"}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform ${
                      connectionState !== "connected"
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-800 hover:shadow-sm"
                    }`}
                  >
                    Disconnect
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-500 text-white hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {(!getToken()) && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                  <div className="flex items-center justify-between gap-4">
                    <span>No JWT found — you need to sign in to fetch lobbies and connect.</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate("/login")}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => {
                          // quick debug helper: log localStorage contents to console
                          console.log("localStorage jwt:", localStorage.getItem("jwt"))
                          logEvent(`localStorage jwt: ${!!localStorage.getItem("jwt")}`)
                        }}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm"
                      >
                        Debug
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {statusMessage && (
                <p className="text-sm text-gray-600" aria-live="polite">
                  {statusMessage}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Lobbies</h3>
                  <button
                    type="button"
                    onClick={fetchLobbies}
                    disabled={isFetchingLobbies}
                    className={`text-sm font-medium px-3 py-1 rounded-md transition ${
                      isFetchingLobbies ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white border border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    {isFetchingLobbies ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <span>Refreshing</span>
                      </div>
                    ) : (
                      "Refresh"
                    )}
                  </button>
                </div>

                {lobbies.length === 0 ? (
                  <div className="text-sm text-gray-500">No lobbies available</div>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-50 rounded-lg overflow-hidden">
                    {lobbies.map((l, idx) => (
                      <li key={l.id ?? idx} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{l.name || `Lobby ${idx + 1}`}</div>
                          <div className="text-xs text-gray-500">{l.playerCount ?? "0"} players</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:scale-105"
                            onClick={async () => {
                              // Example: invoking server RPC - adjust method name to your server
                              if (!connectionRef.current) {
                                logEvent("No hub connection to join lobby")
                                return
                              }
                              try {
                                // Demo: if your hub has JoinLobby(lobbyId), call it:
                                // await connectionRef.current.invoke("JoinLobby", l.id)
                                logEvent(`(demo) invoked JoinLobby for ${l.id ?? idx}`)
                              } catch (err) {
                                console.error("JoinLobby error:", err)
                                logEvent(`JoinLobby failed: ${err?.message || err}`)
                              }
                            }}
                          >
                            Join
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Events</h3>
                <div className="bg-gray-100 p-3 rounded h-44 overflow-y-auto text-sm">
                  {events.length === 0 ? <div className="text-gray-500">No events yet</div> : events.map((ev, i) => <div key={i}>{ev}</div>)}
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                <strong>Debugging tips:</strong> If connection fails, check server CORS, hub URL <code>/lobbyHub</code>, and that the token is valid. Also open browser DevTools → Network to inspect Authorization header.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
