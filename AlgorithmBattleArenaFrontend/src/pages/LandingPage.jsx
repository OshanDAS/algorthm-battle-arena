import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sword, Shield, Crown, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-100 text-gray-900 relative overflow-hidden">
      {/* Parchment texture and atmospheric elements */}
      <div className="absolute inset-0">
        {/* Dusty atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-transparent to-orange-100/20"></div>
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1200 200" className="w-full h-32 fill-gray-800/60">
            <polygon points="0,200 300,50 600,80 900,30 1200,60 1200,200" />
          </svg>
        </div>
        {/* Subtle glowing orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-amber-300/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6 border-b border-amber-300/40">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 border-2 border-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-600/30">
                <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-800 tracking-wider">
                Algorithm Battle Arena
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border-2 border-amber-600 text-amber-800 bg-amber-50/80 hover:bg-amber-100 hover:shadow-lg hover:shadow-amber-600/20 transition-all duration-300"
              >
                Enter
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm bg-gradient-to-r from-orange-600 to-red-600 border-2 border-orange-500 text-white hover:from-orange-500 hover:to-red-500 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300"
              >
Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="w-full max-w-6xl text-center">
            {/* Hero section */}
            <div className="mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 border-4 border-amber-600 rounded-full mb-4 sm:mb-6 shadow-2xl shadow-amber-600/30 animate-pulse">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-700 to-amber-700 tracking-wider">
                ⚡ ALGORITHM BATTLE ⚡
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-amber-800/80 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
                Welcome to the ultimate competitive programming platform where students battle with code, 
                teachers create challenges, and administrators oversee the arena.
              </p>
            </div>

            {/* Role cards - Silhouette style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Shadow Warrior */}
              <div className="group relative bg-gray-900/90 border-2 border-cyan-500/60 hover:border-cyan-400 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-4 sm:p-6 lg:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-900 border-2 border-cyan-400 flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:border-cyan-300 transition-colors shadow-lg shadow-cyan-500/30">
                    <Sword className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-cyan-300 tracking-wider">⚔ STUDENT</h3>
                  <p className="text-sm sm:text-base text-cyan-200/70 mb-4 sm:mb-6">Join coding battles and compete with peers</p>
                  <button
                    onClick={() => navigate('/register?role=student')}
                    className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-cyan-600 to-blue-600 border-2 border-cyan-400 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/40 transition-all duration-300 font-semibold tracking-wide"
                  >
                    Join as Student
                  </button>
                </div>
              </div>

              {/* Shadow Master */}
              <div className="group relative bg-gray-900/90 border-2 border-orange-500/60 hover:border-orange-400 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-4 sm:p-6 lg:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-900 border-2 border-orange-400 flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:border-orange-300 transition-colors shadow-lg shadow-orange-500/30">
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-orange-400 group-hover:text-orange-300 transition-colors" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-orange-300 tracking-wider">👑 TEACHER</h3>
                  <p className="text-sm sm:text-base text-orange-200/70 mb-4 sm:mb-6">Create challenges and manage students</p>
                  <button
                    onClick={() => navigate('/register?role=teacher')}
                    className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-orange-600 to-red-600 border-2 border-orange-400 text-white hover:from-orange-500 hover:to-red-500 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300 font-semibold tracking-wide"
                  >
                    Join as Teacher
                  </button>
                </div>
              </div>

              {/* Shadow Lord */}
              <div className="group relative bg-gray-900/90 border-2 border-red-500/60 hover:border-red-400 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 transform hover:scale-105 sm:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-4 sm:p-6 lg:p-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gray-900 border-2 border-red-400 flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:border-red-300 transition-colors shadow-lg shadow-red-500/30">
                    <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400 group-hover:text-red-300 transition-colors" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-red-300 tracking-wider">🛡 ADMIN</h3>
                  <p className="text-sm sm:text-base text-red-200/70 mb-4 sm:mb-6">Oversee the platform and manage users</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-red-600 to-red-800 border-2 border-red-400 text-white hover:from-red-500 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/40 transition-all duration-300 font-semibold tracking-wide"
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}