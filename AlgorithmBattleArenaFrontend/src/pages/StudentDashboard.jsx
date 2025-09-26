import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, User, Users, Trophy, Swords, PlayCircle } from 'lucide-react';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
    {icon}
    <div>
      <p className="text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const FriendListItem = ({ name, online }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
    <div className="flex items-center space-x-3">
      <User className="h-8 w-8 text-gray-400" />
      <p className="text-white">{name}</p>
    </div>
    <div className={`h-3 w-3 rounded-full ${online ? 'bg-green-400' : 'bg-gray-600'}`}></div>
  </div>
);

const LobbyContestItem = ({ name, participants, buttonText }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
    <div>
        <p className="text-white">{name}</p>
        <div className="flex items-center space-x-2 mt-1">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300 text-sm">{participants}</span>
        </div>
    </div>
    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
        {buttonText}
    </button>
  </div>
);

export default function StudentDashboard() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 relative text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            <img src="/src/assets/react.svg" alt="Profile" className="h-12 w-12 rounded-full bg-white/10 border border-white/20" />
            <div>
              <p className="font-semibold">Student Name</p>
              <p className="text-sm text-gray-400">student@example.com</p>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Trophy className="h-10 w-10 text-yellow-400" />} label="Rank" value="#1,234" />
          <StatCard icon={<BarChart className="h-10 w-10 text-blue-400" />} label="Matches Played" value="88" />
          <StatCard icon={<Swords className="h-10 w-10 text-red-400" />} label="Win Rate" value="56%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Battle Options */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Start a Battle</h2>
              <div className="flex space-x-4">
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                  <PlayCircle className="h-6 w-6" />
                  <span>Solo Battle</span>
                </button>
                <Link to="/lobby" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                  <Swords className="h-6 w-6" />
                  <span>Multiplayer</span>
                </Link>
              </div>
            </div>

            {/* Available Lobbies */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Available Lobbies</h3>
                <div className="space-y-3">
                    <LobbyContestItem name="Beginner's Arena" participants="8/10" buttonText="Join" />
                    <LobbyContestItem name="Data Structures Duel" participants="4/10" buttonText="Join" />
                    <LobbyContestItem name="Dynamic Programming Dojo" participants="6/10" buttonText="Join" />
                </div>
            </div>

            {/* Active Contests */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Active Contests</h3>
                <div className="space-y-3">
                    <LobbyContestItem name="Weekly Challenge #12" participants="128" buttonText="Participate" />
                    <LobbyContestItem name="Weekend Sprint" participants="64" buttonText="Participate" />
                </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-8">
            {/* Friends List */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Friends</h3>
              <div className="space-y-3">
                <FriendListItem name="Alice" online={true} />
                <FriendListItem name="Bob" online={false} />
                <FriendListItem name="Charlie" online={true} />
                <FriendListItem name="David" online={false} />
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
               <div className="space-y-3">
                  <p className="text-gray-300">1. TopPlayer</p>
                  <p className="text-gray-300">2. CodeMaster</p>
                  <p className="text-gray-300">3. AlgoQueen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
