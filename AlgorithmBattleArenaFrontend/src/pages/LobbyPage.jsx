import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, PlusSquare, Swords, Loader2, ArrowLeft } from 'lucide-react';
import apiService from '../services/api';
import CreateLobbyModal from '../components/CreateLobbyModal';
import { useAuth } from '../services/auth';

const LobbyItem = ({ lobby, onJoin }) => (
  <div
    className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl flex items-center justify-between"
  >
    <Link to={`/lobby/${lobby.lobbyId}`} className="flex-grow">
      <div>
        <p className="text-xl font-bold text-white">{lobby.lobbyName}</p>
        <p className="text-sm text-gray-300">{lobby.mode}</p>
      </div>
    </Link>
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-gray-400" />
        <span className="text-lg font-semibold text-white">{lobby.participants.length}/{lobby.maxPlayers}</span>
      </div>
      <button 
        onClick={() => onJoin(lobby.lobbyCode)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-transform duration-300 transform hover:scale-105"
      >
        Join
      </button>
    </div>
  </div>
);

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobbies, setLobbies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const fetchLobbies = async () => {
      try {
        const response = await apiService.lobbies.getAll();
        setLobbies(response.data);
      } catch (error) {
        console.error('Failed to fetch lobbies:', error);
      }
      setIsLoading(false);
    };

    fetchLobbies();
  }, []);

  const handleCreateLobby = async (lobbyData) => {
    try {
      const response = await apiService.lobbies.create(lobbyData);
      setIsModalOpen(false);
      navigate(`/lobby/${response.data.lobbyId}?new=true`);
    } catch (error) {
      console.error('Failed to create lobby:', error);
    }
  };

  const handleJoinLobby = async (lobbyCode) => {
    try {
      const response = await apiService.lobbies.join(lobbyCode);
      navigate(`/lobby/${response.data.lobbyId}`);
    } catch (error) {
      console.error('Failed to join lobby:', error);
    }
  };

  const handleBackToDashboard = () => {
    switch (user.role) {
      case 'Admin':
        navigate('/admin');
        break;
      case 'Teacher':
        navigate('/teacher');
        break;
      case 'Student':
        navigate('/student-dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold flex items-center"><Swords className="mr-4"/> Lobbies</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300"
              >
                <PlusSquare className="h-6 w-6" />
                <span>Create New Lobby</span>
              </button>
              <button 
                onClick={handleBackToDashboard}
                className="bg-slate-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300"
              >
                <ArrowLeft className="h-6 w-6" />
                <span>Dashboard</span>
              </button>
            </div>
          </header>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Join a Private Lobby</h2>
            <div className="flex items-center space-x-2 bg-white/10 p-2 rounded-2xl">
              <input 
                type="text" 
                placeholder="Enter lobby code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-transparent text-white rounded-lg p-3 outline-none"
              />
              <button 
                onClick={() => handleJoinLobby(joinCode)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-transform duration-300 transform hover:scale-105"
              >
                Join
              </button>
            </div>
          </div>

          <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Available Lobbies</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              ) : lobbies.length > 0 ? (
                  lobbies.map(lobby => <LobbyItem key={lobby.lobbyId} lobby={lobby} onJoin={handleJoinLobby} />)
              ) : (
                  <p className="text-center text-gray-400">No lobbies available. Why not create one?</p>
              )}
          </div>
        </div>
      </div>
      <CreateLobbyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateLobby} 
      />
    </>
  );
}
