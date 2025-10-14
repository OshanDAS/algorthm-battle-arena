import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Users, BookOpen, Plus, Trophy, Sword } from 'lucide-react';
import { useAuth } from '../services/auth';
import ChatButton from '../components/ChatButton';
import ChatWindow from '../components/ChatWindow';

export default function TeacherDashboard() {
  const { logout } = useAuth();
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
      <header className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-purple-400">Master's Sanctum</h1>
          </div>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Training Grounds</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <Users className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">My Warriors</h3>
              <p className="text-3xl font-bold text-purple-400">47</p>
            </div>
            <div className="bg-gradient-to-br from-blue-800/50 to-blue-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <BookOpen className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Challenges Created</h3>
              <p className="text-3xl font-bold text-blue-400">23</p>
            </div>
            <div className="bg-gradient-to-br from-green-800/50 to-green-900/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
              <Trophy className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Battles Hosted</h3>
              <p className="text-3xl font-bold text-green-400">89</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
              <Plus className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Create Challenge</h3>
              <p className="text-gray-300 mb-4">Forge new coding trials</p>
              <button className="w-full py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-all">
                Create
              </button>
            </div>
            
            <Link to="/manage-students" className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all block">
              <Users className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Manage Warriors</h3>
              <p className="text-gray-300 mb-4">Guide your students</p>
              <div className="w-full py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all text-center">
                Manage
              </div>
            </Link>

            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all">
              <Sword className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Host Battle</h3>
              <p className="text-gray-300 mb-4">Start epic competitions</p>
              <button className="w-full py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all">
                Host
              </button>
            </div>
          </div>
        </div>
        </main>
        
        {/* Chat Components */}
        <ChatButton onClick={() => setShowChat(true)} />
        <ChatWindow 
          isOpen={showChat} 
          onClose={() => setShowChat(false)}
        />
      </div>
    );
  }