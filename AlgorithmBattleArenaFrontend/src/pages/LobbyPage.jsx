"use client"

import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as signalR from "@microsoft/signalr"
import { Code, Users, Trophy, Zap, CheckCircle, Swords, Timer, Target, Shield } from "lucide-react"

/** Skill Level Indicator - adapted from password strength */
const SkillLevelIndicator = ({ level }) => {
  const getColor = () => {
    if (level === "Beginner") return "bg-green-500"
    if (level === "Intermediate") return "bg-yellow-500"
    if (level === "Advanced") return "bg-orange-500"
    return "bg-red-500"
  }
  const getTextColor = () => {
    if (level === "Beginner") return "text-green-600"
    if (level === "Intermediate") return "text-yellow-600"
    if (level === "Advanced") return "text-orange-600"
    return "text-red-600"
  }

  if (!level) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 font-medium">Skill Level</span>
        <span className={`text-sm font-semibold ${getTextColor()}`}>{level}</span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{
            width: level === "Beginner" ? "25%" : level === "Intermediate" ? "50%" : level === "Advanced" ? "75%" : "100%",
          }}
        />
      </div>
    </div>
  )
}

/** Main LobbyPage component */
export default function LobbyPage() {
  const navigate = useNavigate()
  const connectionRef = useRef(null)

  // Reactive token management
  const [token, setToken] = useState(() => localStorage.getItem("jwt"))
  const [connectionState, setConnectionState] = useState("disconnected")
  const [isFetchingLobbies, setIsFetchingLobbies] = useState(false)
  const [lobbies, setLobbies] = useState([])
  const [events, setEvents] = useState([])
  const [statusMessage, setStatusMessage] = useState("")
  const [success, setSuccess] = useState(false)

  // Form states
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState("Solo")
  const [selectedDifficulty, setSelectedDifficulty] = useState("Beginner")
  const [formData, setFormData] = useState({
    playerName: "",
    preferredLanguage: "JavaScript",
    battleMode: "Solo",
    difficulty: "Beginner",
    timeLimit: "30",
  })
  const [errors, setErrors] = useState({})

  // Sync token with localStorage
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "jwt") setToken(e.newValue)
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Log events for debugging
  const logEvent = (message) => {
    const time = new Date().toLocaleTimeString()
    setEvents((prev) => [...prev, `${time}: ${message}`])
  }

  // Get latest token
  const getToken = () => localStorage.getItem("jwt") || token

  // Fetch lobbies
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

  // Start SignalR connection
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
      .configureLogging(signalR.LogLevel.Information)
      .build()

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
      fetchLobbies()
    } catch (err) {
      console.error("SignalR connection failed:", err)
      setConnectionState("disconnected")
      setStatusMessage("Connection failed")
      logEvent(`SignalR connection failed: ${err?.message || err}`)
    }
  }

  // Stop SignalR connection
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("jwt")
    setToken(null)
    if (connectionRef.current) stopConnection().catch(() => {})
    navigate("/login")
  }

  // Form validation
  const validatePlayerName = (value) => {
    if (value.length < 3) return "At least 3 characters required"
    if (value.length > 20) return "Maximum 20 characters allowed"
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return "Only letters, numbers, underscore and dash allowed"
    return ""
  }

  const validateForm = () => {
    const newErrors = {}
    const nameError = validatePlayerName(formData.playerName)
    if (nameError) newErrors.playerName = nameError
    if (!formData.preferredLanguage) newErrors.preferredLanguage = "Please select a programming language"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  // Mode and difficulty handlers
  const handleModeSelect = (mode) => {
    setSelectedMode(mode)
    setFormData((prev) => ({ ...prev, battleMode: mode }))
  }

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty)
    setFormData((prev) => ({ ...prev, difficulty }))
  }

  // Form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setStatusMessage("")
    if (!validateForm()) return
    
    const currentToken = getToken()
    if (!currentToken) {
      setStatusMessage("Not authenticated")
      return
    }

    setIsLoading(true)
    setStatusMessage("Creating battle lobby...")

    const lobbyData = {
      name: `${formData.playerName}'s ${formData.battleMode} Battle`,
      maxPlayers: formData.battleMode === "Solo" ? 1 : 10
    }

    try {
      const res = await fetch("http://localhost:5000/api/Lobbies", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lobbyData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      const createdLobby = await res.json()
      setStatusMessage("Lobby created successfully!")
      logEvent(`Lobby created: ${createdLobby.id || 'Unknown ID'}`)
      fetchLobbies() // Refresh lobby list
      setIsLoading(false)
    } catch (err) {
      console.error("CreateLobby error:", err)
      setStatusMessage("Failed to create lobby: " + (err?.message || err))
      logEvent(`CreateLobby failed: ${err?.message || err}`)
      setIsLoading(false)
    }
  }

  // Join lobby
  const handleJoinLobby = async (lobbyId) => {
    const currentToken = getToken()
    if (!currentToken) {
      setStatusMessage("Not authenticated")
      return
    }

    setIsLoading(true)
    setStatusMessage("Joining lobby...")

    try {
      const res = await fetch(`http://localhost:5000/api/Lobbies/${lobbyId}/join`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentToken}`,
          "Content-Type": "application/json"
        }
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }

      setStatusMessage("Lobby joined successfully!")
      setSuccess(true)
      setIsLoading(false)
      logEvent(`Joined lobby ${lobbyId}`)
      fetchLobbies() // Refresh lobby list
    } catch (err) {
      console.error("JoinLobby error:", err)
      setStatusMessage("Failed to join lobby: " + (err?.message || err))
      logEvent(`JoinLobby failed: ${err?.message || err}`)
      setIsLoading(false)
    }
  }

  // Redirect on success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => {
      navigate("/arena")
    }, 1200)
    return () => clearTimeout(t)
  }, [success, navigate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {})
        connectionRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="w-full lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center">
          {/* Left column - Info */}
          <div className="hidden lg:block space-y-8 xl:space-y-12">
            <div className="text-left">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform">
                <Swords className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">Algorithm Battle Arena</h1>
              <p className="text-gray-300 text-lg xl:text-xl leading-relaxed mb-8">
                Join real-time multiplayer lobbies or practice solo. Authenticate, connect, and battle with code!
              </p>
              <div className="space-y-4 xl:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Real-time Coding</h3>
                    <p className="text-gray-400 text-sm">Battle with live lobby updates</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Competitive Rankings</h3>
                    <p className="text-gray-400 text-sm">Climb the leaderboards</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Lightning Fast</h3>
                    <p className="text-gray-400 text-sm">Powered by SignalR for instant updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form and Lobby List */}
          <div className="w-full">
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
                <Swords className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Algorithm Battle Arena</h1>
              <p className="text-gray-300 text-sm sm:text-base">Configure your battle and join a lobby</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6 sm:space-y-8 relative">
              {/* Connection controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white">Connection</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        connectionState === "connected"
                          ? "text-emerald-400"
                          : connectionState === "connecting"
                          ? "text-amber-400"
                          : "text-gray-400"
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
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105"
                    }`}
                  >
                    {connectionState === "connecting" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-3 border-gray-400 border-t-gray-200 rounded-full animate-spin" />
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
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20"
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

              {/* Auth warning */}
              {!getToken() && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-300">
                  <div className="flex items-center justify-between gap-4">
                    <span>No JWT found — you need to sign in to join lobbies.</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate("/login")}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={() => {
                          console.log("localStorage jwt:", localStorage.getItem("jwt"))
                          logEvent(`localStorage jwt: ${!!localStorage.getItem("jwt")}`)
                        }}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-md text-sm text-gray-300"
                      >
                        Debug
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Battle setup form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-4">
                  <label className="text-sm sm:text-base font-bold text-white block">Battle Mode</label>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { mode: "Solo", icon: Target, color: "from-blue-500 to-cyan-500", desc: "Practice alone" },
                      { mode: "Multiplayer", icon: Users, color: "from-purple-500 to-pink-500", desc: "Battle others" },
                    ].map(({ mode, icon: Icon, color, desc }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleModeSelect(mode)}
                        className={`relative p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 font-semibold border-2 transition-all duration-300 transform ${
                          selectedMode === mode
                            ? `bg-gradient-to-r ${color} text-white border-transparent shadow-xl scale-105`
                            : "bg-white/5 text-gray-300 border-white/20 hover:border-white/40 hover:shadow-md hover:scale-105"
                        }`}
                      >
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span className="text-xs sm:text-sm">{mode}</span>
                        <span className="text-xs text-gray-400">{desc}</span>
                        {selectedMode === mode && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Player Name</label>
                    <input
                      type="text"
                      placeholder="Enter your battle name"
                      value={formData.playerName}
                      onChange={(e) => handleInputChange("playerName", e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 text-white placeholder-gray-400 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base ${
                        errors.playerName
                          ? "border-red-400 focus:border-red-500 focus:bg-red-500/10"
                          : "border-white/20 focus:border-purple-400 focus:bg-white/20 focus:shadow-md"
                      }`}
                    />
                    {errors.playerName && (
                      <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full" />
                        {errors.playerName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Preferred Language</label>
                    <select
                      value={formData.preferredLanguage}
                      onChange={(e) => handleInputChange("preferredLanguage", e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 text-white border-2 border-white/20 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base focus:border-purple-400 focus:bg-white/20"
                    >
                      <option value="JavaScript" className="bg-gray-800">JavaScript</option>
                      <option value="Python" className="bg-gray-800">Python</option>
                      <option value="Java" className="bg-gray-800">Java</option>
                      <option value="C++" className="bg-gray-800">C++</option>
                      <option value="TypeScript" className="bg-gray-800">TypeScript</option>
                      <option value="Go" className="bg-gray-800">Go</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">Difficulty Level</label>
                      <div className="space-y-3">
                        {["Beginner", "Intermediate", "Advanced", "Expert"].map((difficulty) => (
                          <button
                            key={difficulty}
                            type="button"
                            onClick={() => handleDifficultySelect(difficulty)}
                            className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                              selectedDifficulty === difficulty
                                ? "bg-purple-600 text-white border-2 border-purple-400"
                                : "bg-white/5 text-gray-300 border-2 border-white/20 hover:border-white/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{difficulty}</span>
                              {selectedDifficulty === difficulty && <CheckCircle className="w-4 h-4" />}
                            </div>
                          </button>
                        ))}
                      </div>
                      <SkillLevelIndicator level={selectedDifficulty} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white">Time Limit (minutes)</label>
                      <div className="space-y-3">
                        {["15", "30", "45", "60"].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleInputChange("timeLimit", time)}
                            className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                              formData.timeLimit === time
                                ? "bg-blue-600 text-white border-2 border-blue-400"
                                : "bg-white/5 text-gray-300 border-2 border-white/20 hover:border-white/40"
                            }`}
                          >
                            <Timer className="w-4 h-4" />
                            <span className="font-medium">{time} minutes</span>
                            {formData.timeLimit === time && <CheckCircle className="w-4 h-4 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !getToken()}
                      className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg flex justify-center items-center gap-2 sm:gap-3 transition-all duration-300 transform ${
                        isLoading || !getToken()
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-4 border-gray-400 border-t-gray-200 rounded-full animate-spin" />
                          <span>Creating Lobby...</span>
                        </div>
                      ) : (
                        <>
                          <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span>Create Lobby</span>
                        </>
                      )}
                    </button>
                  </div>

                  {statusMessage && (
                    <p className="text-sm text-gray-300" aria-live="polite">
                      {statusMessage}
                    </p>
                  )}
                </div>
              </form>

              {/* Lobby list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Available Lobbies</h3>
                  <button
                    type="button"
                    onClick={fetchLobbies}
                    disabled={isFetchingLobbies || !getToken()}
                    className={`text-sm font-medium px-3 py-1 rounded-md transition ${
                      isFetchingLobbies || !getToken()
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {isFetchingLobbies ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-200 rounded-full animate-spin" />
                        <span>Refreshing</span>
                      </div>
                    ) : (
                      "Refresh"
                    )}
                  </button>
                </div>
                {lobbies.length === 0 ? (
                  <div className="text-sm text-gray-400">No lobbies available</div>
                ) : (
                  <ul className="divide-y divide-white/20 border border-white/20 rounded-lg overflow-hidden">
                    {lobbies.map((lobby, idx) => (
                      <li key={lobby.id || idx} className="px-4 py-3 bg-white/5 border-b border-white/10 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-white">{lobby.name || `Lobby ${idx + 1}`}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              <span className="inline-block mr-3">ID: {lobby.id || 'N/A'}</span>
                              <span className="inline-block mr-3">Max Players: {lobby.maxPlayers || 'N/A'}</span>
                              <span className="inline-block">Current: {lobby.currentPlayers || 0}/{lobby.maxPlayers || 'N/A'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ml-4 ${
                              !getToken() || isLoading
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105"
                            }`}
                            onClick={() => handleJoinLobby(lobby.id)}
                            disabled={!getToken() || isLoading || !lobby.id}
                          >
                            Join
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Events log */}
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Events</h3>
                <div className="bg-white/5 p-3 rounded h-44 overflow-y-auto text-sm text-gray-300">
                  {events.length === 0 ? (
                    <div className="text-gray-400">No events yet</div>
                  ) : (
                    events.map((ev, i) => <div key={i}>{ev}</div>)
                  )}
                </div>
              </div>

              {/* Debug footer */}
              <div className="text-xs text-gray-400 border-t border-white/20 pt-3">
                <strong>Debugging tips:</strong> If connection fails, check server CORS, hub URL <code>/lobbyHub</code>, and that the token is valid. Open DevTools → Network to inspect Authorization header.
              </div>

              <div className="text-center pt-4 sm:pt-6 border-t border-white/20">
                <p className="text-gray-400 text-sm sm:text-base">
                  Need to practice first?{" "}
                  <button
                    type="button"
                    className="text-purple-400 font-semibold hover:text-purple-300 transition-colors underline decoration-2 underline-offset-2"
                    onClick={() => navigate("/training")}
                  >
                    Visit Training Grounds
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg mx-4 bg-gray-900 border border-purple-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Battle Ready!</h2>
            <p className="text-sm sm:text-base text-gray-300 text-center">
              You've successfully joined the arena. Prepare for algorithmic combat!
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate("/arena")}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
              >
                Enter Arena
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setStatusMessage("")
                }}
                className="px-4 py-2 bg-white/10 border border-white/20 text-gray-300 rounded-lg font-medium hover:bg-white/20 transition"
              >
                Stay in Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}