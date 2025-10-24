import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Crown, Play, Loader2, LogOut, UserPlus, XCircle, Shield, Copy, Trash2, CheckCircle, Info } from 'lucide-react';
import apiService from '../services/api';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../services/auth';
import ProblemBrowserModal from '../components/ProblemBrowserModal';
import { MessageCircle, Send } from 'lucide-react';
import { useChat } from '../hooks/useChat';

const SimpleChatWindow = ({ conversationId, currentUserEmail, onSendMessage, messages }) => {
  const [newMessage, setNewMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
    return (
        <div className="flex flex-col bg-white/5 rounded-lg border border-white/10 max-h-[55vh] md:h-96 overflow-y-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.senderEmail === currentUserEmail ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow-lg ${
                message.senderEmail === currentUserEmail 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-white/15 text-white border border-white/20'
              }`}>
                {message.senderEmail !== currentUserEmail && (
                  <div className="text-xs text-gray-300 mb-1 font-medium">{message.senderName || message.senderEmail}</div>
                )}
                <div className="break-words">{message.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/20">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-2 rounded-xl transition-all shadow-lg disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

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
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [selectedProblems, setSelectedProblems] = useState([]);

    const [language, setLanguage] = useState('Python');
    const [maxProblems, setMaxProblems] = useState(5);
    const [durationSec, setDurationSec] = useState(600);
    const [showChat, setShowChat] = useState(false);
    
    // Chat functionality
    const { messages, joinConversation, sendMessage, leaveConversation, conversations } = useChat();
    const [lobbyConversationId, setLobbyConversationId] = useState(null);

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

        // Ensure SignalR connection and join lobby
        const joinLobbyAsync = async () => {
            try {
                await signalRService.joinLobby(lobbyId);
            } catch (error) {
                console.error('Failed to join SignalR lobby:', error);
            }
        };
        joinLobbyAsync();

        const unsubscribeLobbyUpdated = signalRService.onLobbyUpdated(updatedLobby => {
            if (updatedLobby.lobbyId.toString() === lobbyId) {
                setLobby({ ...updatedLobby });
            }
        });

        const unsubscribeMatchStarted = signalRService.onMatchStarted(match => {
            console.log('MatchStarted event received:', match);
            alert('MatchStarted event received!');
            navigate(`/match/${match.matchId}`, { state: { match } });
        });

        const unsubscribeLobbyDeleted = signalRService.onLobbyDeleted(() => {
            navigate('/lobby');
        });

        return () => {
            signalRService.leaveLobby(lobbyId);
            unsubscribeLobbyUpdated();
            unsubscribeMatchStarted();
            unsubscribeLobbyDeleted();
            if (lobbyConversationId) {
                leaveConversation(lobbyConversationId);
            }
        };
    }, [lobbyId, navigate, signalRService, lobbyConversationId, leaveConversation]);
    
    // Find and join lobby conversation
    useEffect(() => {
        const lobbyConv = conversations.find(c => c.type === 'Lobby' && c.referenceId === parseInt(lobbyId));
        if (lobbyConv && lobbyConv.conversationId !== lobbyConversationId) {
            setLobbyConversationId(lobbyConv.conversationId);
            joinConversation(lobbyConv.conversationId);
        }
    }, [conversations, lobbyId, lobbyConversationId, joinConversation]);
    
    const handleSendMessage = async (content) => {
        if (lobbyConversationId) {
            await sendMessage(lobbyConversationId, content);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) {
            console.log('Not host, cannot start game');
            return;
        }
        if (selectedProblems.length === 0) {
            console.log('No problems selected');
            alert('Please select problems before starting the match');
            return;
        }
        
        console.log('Starting match with:', { 
            lobbyId, 
            problemIds: selectedProblems.map(p => p.problemId), 
            durationSec 
        });
        
        try {
            const response = await apiService.matches.start(lobbyId, { 
                problemIds: selectedProblems.map(p => p.problemId), 
                durationSec,
                preparationBufferSec: 5
            });
            console.log('Match start response:', response.data);
            
            // Navigate directly to match page with the match data
            navigate(`/match/${response.data.matchId}`, { state: { match: response.data } });
        } catch (error) {
            console.error('Failed to start match:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || error.message;
            alert('Failed to start match: ' + errorMessage);
        }
    };

    const handleGenerateProblems = async () => {
        if (!isHost) return;
        try {
            const response = await apiService.problems.generate({ language, difficulty: lobby.difficulty, maxProblems });
            if (response.data.length === 0) {
                alert('No problems found for the selected criteria.');
            }
            setSelectedProblems(response.data);
        } catch (error) {
            console.error('Error generating problems:', error);
        }
    };

    const handleAddProblems = (problems) => {
        setSelectedProblems(prev => [...prev, ...problems]);
    };

    const handleRemoveProblem = (problemId) => {
        setSelectedProblems(prev => prev.filter(p => p.problemId !== problemId));
    };

    const handleJoinLobby = async () => {
        try {
            await apiService.lobbies.join(lobby.lobbyCode);
        } catch (error) {
            console.error('Failed to join lobby:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to join lobby';
            alert(errorMessage);
        }
    };

    const handleLeaveLobby = async () => {
        try {
            await apiService.lobbies.leave(lobbyId);
            navigate('/lobby', { replace: true });
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

    const handlePrivacyChange = async () => {
        if (!isHost) return;
        try {
            await apiService.lobbies.updatePrivacy(lobbyId, !lobby.isPublic);
        } catch (error) {
            console.error('Failed to update lobby privacy:', error);
        }
    };

    const handleDifficultyChange = async (e) => {
        if (!isHost) return;
        const newDifficulty = e.target.value;
        const oldLobby = lobby;
        setLobby(prevLobby => ({ ...prevLobby, difficulty: newDifficulty }));
        try {
            await apiService.lobbies.updateDifficulty(lobbyId, newDifficulty);
        } catch (error) {
            console.error('Failed to update lobby difficulty:', error);
            setLobby(oldLobby);
        }
    };

    const handleDeleteLobby = async () => {
        if (!isHost) return;
        if (window.confirm('Are you sure you want to delete this lobby?')) {
            try {
                await apiService.lobbies.delete(lobbyId);
                navigate('/lobby');
            }
            catch (error) {
                console.error('Failed to delete lobby:', error);
            }
        }
    };

    const copyLobbyCode = () => {
        navigator.clipboard.writeText(lobby.lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderTags = (tagsString) => {
        try {
            const tags = JSON.parse(tagsString);
            if (Array.isArray(tags)) {
                return tags.map(tag => <span key={tag} className="bg-gray-600 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{tag}</span>);
            }
        } catch (e) {
            return <span className="bg-gray-600 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">{tagsString}</span>;
        }
        return null;
    };

    if (isLoading || !lobby) {
        return (
            <div className="min-h-screen w-full bg-gray-900 py-8 relative text-white flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative text-white">
                <div className="w-full max-w-6xl mx-auto px-4">
                    <header className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Lobby: {lobby.lobbyName}</h1>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Column: Settings */}
                        <div className="lg:col-span-1 col-span-1 bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl space-y-6">
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
                                    
                                    <div className="border-t border-slate-700 my-4"></div>

                                    <h3 className="text-xl font-bold">Problem Selection</h3>

                                    <div>
                                        <label className="font-semibold">Language</label>
                                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white/5 p-2 rounded-lg mt-1">
                                            <option>Python</option>
                                            <option>C</option>
                                            <option>C++</option>
                                            <option>Java</option>
                                            <option>JavaScript</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-semibold">Max Problems</label>
                                        <input type="number" value={maxProblems} onChange={(e) => setMaxProblems(parseInt(e.target.value, 10))} className="w-full bg-white/5 p-2 rounded-lg mt-1" />
                                    </div>
                                    <div>
                                        <label className="font-semibold">Match Duration (seconds)</label>
                                        <input type="number" value={durationSec} onChange={(e) => setDurationSec(parseInt(e.target.value, 10))} className="w-full bg-white/5 p-2 rounded-lg mt-1" />
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="relative flex-grow">
                                            <button onClick={handleGenerateProblems} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2">
                                                <span>Generate Random</span>
                                                <div className="group relative">
                                                    <Info className="h-5 w-5 text-blue-200" />
                                                    <div className="absolute bottom-full mb-2 w-64 bg-slate-900 text-white text-xs rounded-lg p-2 invisible group-hover:visible border border-slate-700 shadow-lg">
                                                        Problems are randomly selected based on the chosen language and difficulty. If difficulty is "Mixed", it will select from all difficulties.
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                        <button onClick={() => setIsBrowserOpen(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl">
                                            Browse
                                        </button>
                                    </div>

                                    <div className="border-t border-slate-700 my-4"></div>

                                    <button onClick={handleDeleteLobby} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2">
                                        <Trash2 className="h-5 w-5" />
                                        <span>Delete Lobby</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Middle Column: Players & Controls */}
                        <div className="lg:col-span-2 col-span-1 bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <h2 className="text-2xl font-bold flex items-center mb-4"><Users className="mr-3"/> Participants ({lobby.participants.length}/{lobby.maxPlayers})</h2>
                            
                            <div className="space-y-3 mb-6">
                                {lobby.participants.map(p => (
                                    <PlayerCard key={p.participantEmail} player={p} isHost={isHost} onKick={handleKickPlayer} />
                                ))}
                            </div>

                            {selectedProblems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-4">Selected Problems</h3>
                                    <div className="space-y-2">
                                        {selectedProblems.map(p => (
                                            <div key={p.problemId} className="flex items-center justify-between p-3 rounded-lg bg-slate-700">
                                                <div>
                                                    <p className="text-white font-semibold">{p.title}</p>
                                                    <p className="text-sm text-gray-400">{p.difficultyLevel}</p>
                                                    <div className="mt-2">{renderTags(p.tags)}</div>
                                                </div>
                                                <button onClick={() => handleRemoveProblem(p.problemId)} className="text-red-500 hover:text-red-400">
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                    <button onClick={handleStartGame} disabled={selectedProblems.length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                        <Play className="h-6 w-6" />
                                        <span>Start Game</span>
                                    </button>
                                )}
                            </div>
                            {lobby.status !== 'Open' && <p className="text-center text-yellow-400 mt-4">The lobby is {lobby.status.toLowerCase()}.</p>}
                        </div>
                        
                        {/* Right Column: Chat */}
                        <div className="lg:col-span-1 col-span-1 bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <h2 className="text-xl font-bold flex items-center mb-4">
                                <MessageCircle className="mr-2" /> 
                                Lobby Chat
                            </h2>
                            
                            {lobbyConversationId ? (
                                <SimpleChatWindow
                                    conversationId={lobbyConversationId}
                                    currentUserEmail={user?.email}
                                    onSendMessage={handleSendMessage}
                                    messages={messages[lobbyConversationId] || []}
                                />
                            ) : (
                                <div className="flex-1 max-h-[45vh] md:h-96 flex items-center justify-center text-gray-400">
                                    <p>Loading chat...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ProblemBrowserModal 
                isOpen={isBrowserOpen} 
                onClose={() => setIsBrowserOpen(false)} 
                onAddProblems={handleAddProblems} 
            />

        </>
    );
}
