import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Crown, Play, Loader2, LogOut, UserPlus, XCircle, Shield, Copy, Trash2 } from 'lucide-react';
import apiService from '../services/api';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../services/auth';

const PlayerCard = ({ player, isHost, onKick }) => (
    <div className={`bg-white/10 p-4 rounded-lg flex items-center justify-between border-2 border-transparent`}>
        <div className="flex items-center">
            {player.role === 'Host' && <Crown className="h-5 w-5 text-yellow-400 mr-2" />}
            <p className="text-white font-semibold">{player.participantEmail}</p>
        </div>
        {isHost && player.role !== 'Host' && (
            <button onClick={() => onKick(player.participantEmail)} className="text-red-500 hover:text-red-400">
                <XCircle className="h-5 w-5" />
            </button>
        )}
    </div>
);

const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
);

export default function LobbyInstancePage() {
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const signalRService = useSignalR();
    const { user } = useAuth();

    const [lobby, setLobby] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const [problemId, setProblemId] = useState('00000000-0000-0000-0000-000000000000');
    const [durationSec, setDurationSec] = useState(600);

    const isHost = useMemo(() => lobby?.hostEmail === user?.email, [lobby, user]);
    const isParticipant = useMemo(() => lobby?.participants.some(p => p.participantEmail === user?.email), [lobby, user]);

    useEffect(() => {
        const fetchLobby = async () => {
            try {
                const response = await apiService.lobbies.getById(lobbyId);
                setLobby(response.data);
            } catch (error) {
                console.error('Failed to fetch lobby:', error);
                navigate('/lobby');
            }
            setIsLoading(false);
        };

        fetchLobby();

        signalRService.joinLobby(lobbyId);

        const unsubscribeLobbyUpdated = signalRService.onLobbyUpdated(updatedLobby => {
            if (updatedLobby.lobbyId.toString() === lobbyId) {
                setLobby({ ...updatedLobby });
            }
        });

        const unsubscribeMatchStarted = signalRService.onMatchStarted(match => {
            navigate('/match', { state: { match } });
        });

        const unsubscribeLobbyDeleted = signalRService.onLobbyDeleted(() => {
            navigate('/lobby');
        });

        return () => {
            signalRService.leaveLobby(lobbyId);
            unsubscribeLobbyUpdated();
            unsubscribeMatchStarted();
            unsubscribeLobbyDeleted();
        };
    }, [lobbyId, navigate, signalRService]);

    const handleStartGame = async () => {
        if (!isHost) return;
        try {
            await apiService.matches.start(lobbyId, { problemId, durationSec });
        } catch (error) {
            console.error('Failed to start match:', error);
        }
    };

    const handleJoinLobby = async () => {
        try {
            await apiService.lobbies.join(lobby.lobbyCode);
        } catch (error) {
            console.error('Failed to join lobby:', error);
        }
    };

    const handleLeaveLobby = async () => {
        try {
            await apiService.lobbies.leave(lobbyId);
            navigate('/lobby');
        } catch (error) {
            console.error('Failed to leave lobby:', error);
        }
    };

    const handleKickPlayer = async (email) => {
        if (!isHost) return;
        try {
            await apiService.lobbies.kickParticipant(lobbyId, email);
        } catch (error) {
            console.error('Failed to kick player:', error);
        }
    };

    const handleDifficultyChange = async (e) => {
        if (!isHost) return;
        try {
            await apiService.lobbies.updateDifficulty(lobbyId, e.target.value);
        } catch (error) {
            console.error('Failed to update lobby difficulty:', error);
        }
    };

    const handlePrivacyChange = async () => {
        if (!isHost) return;
        try {
            await apiService.lobbies.updatePrivacy(lobbyId, !lobby.isPublic);
        } catch (error) {
            console.error('Failed to update lobby privacy:', error);
        }
    };

    const handleDeleteLobby = async () => {
        if (!isHost) return;
        if (window.confirm('Are you sure you want to delete this lobby?')) {
            try {
                await apiService.lobbies.delete(lobbyId);
                navigate('/lobby');
            } catch (error) {
                console.error('Failed to delete lobby:', error);
            }
        }
    };

    const copyLobbyCode = () => {
        navigator.clipboard.writeText(lobby.lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading || !lobby) {
        return (
            <div className="min-h-screen w-full bg-gray-900 py-8 relative text-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative text-white">
            <div className="w-full max-w-6xl mx-auto px-4">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Lobby: {lobby.lobbyName}</h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-1 bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl space-y-6">
                        <h2 className="text-2xl font-bold flex items-center"><Settings className="mr-3"/> Settings</h2>
                        
                        <div>
                            <label className="font-semibold">Lobby Code</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <p className="w-full bg-white/5 p-2 rounded-lg font-mono">{lobby.lobbyCode}</p>
                                <button onClick={copyLobbyCode} className="p-2 bg-white/10 rounded-lg">
                                    {copied ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="font-semibold">Mode</label>
                            <p className="w-full bg-white/5 p-2 rounded-lg mt-1">{lobby.mode}</p>
                        </div>

                        <div>
                            <label className="font-semibold">Difficulty</label>
                            {isHost ? (
                                <select 
                                    value={lobby.difficulty}
                                    onChange={handleDifficultyChange}
                                    className="w-full bg-white/5 p-2 rounded-lg mt-1"
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            ) : (
                                <p className="w-full bg-white/5 p-2 rounded-lg mt-1">{lobby.difficulty}</p>
                            )}
                        </div>

                        {isHost && (
                            <>
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold">Public Lobby</label>
                                    <Toggle checked={lobby.isPublic} onChange={handlePrivacyChange} />
                                </div>
                                <div>
                                    <label className="font-semibold">Problem Selection</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white/5 border-gray-600 hover:border-gray-500 hover:bg-white/10">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-gray-500">ZIP, RAR, or other compressed files</p>
                                            </div>
                                            <input id="dropzone-file" type="file" className="hidden" />
                                        </label>
                                    </div> 
                                </div>
                                <div>
                                    <label className="font-semibold">Language</label>
                                    <select className="w-full bg-white/5 p-2 rounded-lg mt-1">
                                        <option>Python</option>
                                        <option>C</option>
                                        <option>C++</option>
                                        <option>Java</option>
                                        <option>JavaScript</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold">Max Problems</label>
                                    <input type="number" defaultValue="5" className="w-full bg-white/5 p-2 rounded-lg mt-1" />
                                </div>
                                <button onClick={handleDeleteLobby} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2">
                                    <Trash2 className="h-5 w-5" />
                                    <span>Delete Lobby</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right Column: Players & Controls */}
                    <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                        <h2 className="text-2xl font-bold flex items-center mb-4"><Users className="mr-3"/> Participants ({lobby.participants.length}/{lobby.maxPlayers})</h2>
                        
                        <div className="space-y-3 mb-6">
                            {lobby.participants.map(p => (
                                <PlayerCard key={p.participantEmail} player={p} isHost={isHost} onKick={handleKickPlayer} />
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            {!isParticipant && lobby.status === 'Open' && (
                                <button onClick={handleJoinLobby} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2">
                                    <UserPlus className="h-6 w-6" />
                                    <span>Join Lobby</span>
                                </button>
                            )}
                            {isParticipant && !isHost && (
                                <button onClick={handleLeaveLobby} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2">
                                    <LogOut className="h-6 w-6" />
                                    <span>Leave Lobby</span>
                                </button>
                            )}
                            {isHost && (
                                <button onClick={handleStartGame} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2">
                                    <Play className="h-6 w-6" />
                                    <span>Start Game</span>
                                </button>
                            )}
                        </div>
                        {lobby.status !== 'Open' && <p className="text-center text-yellow-400 mt-4">The lobby is {lobby.status.toLowerCase()}.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
