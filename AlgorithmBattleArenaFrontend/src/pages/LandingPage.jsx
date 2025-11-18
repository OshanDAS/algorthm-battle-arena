import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sword, Users, BookOpen, Shield, GraduationCap } from 'lucide-react';
import '../styles/mortal-kombat-theme.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="mk-arena">
      {/* MK Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-yellow-600/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 mk-bg-dark">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg mk-glow-red">
                <Sword className="w-7 h-7 text-white" />
              </div>
              <h1 className="mk-title text-2xl">
                Algorithm Battle Arena
              </h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mk-btn mk-btn-fight"
            >
              Enter Arena
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-6xl text-center">
            {/* Hero section */}
            <div className="mb-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-600 to-yellow-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform mk-glow-red">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="mk-title text-4xl lg:text-5xl mb-6">
                Algorithm Battle Arena
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8 mk-text-shadow">
                Welcome to the ultimate competitive programming platform where students battle with code, 
                teachers create challenges, and administrators oversee the arena.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Students */}
              <div className="mk-fighter-card p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg mk-glow-red">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400 mk-text-shadow">Students</h3>
                <p className="text-gray-300 mb-6">Join coding battles, compete with peers, and master algorithms through interactive challenges</p>
              </div>

              {/* Teachers */}
              <div className="mk-fighter-card p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg mk-glow-gold">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400 mk-text-shadow">Teachers</h3>
                <p className="text-gray-300 mb-6">Create challenges, manage students, and guide the next generation of programmers</p>
              </div>

              {/* Admins */}
              <div className="mk-fighter-card p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-red-800 to-red-900 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg mk-glow-red">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-yellow-400 mk-text-shadow">Administrators</h3>
                <p className="text-gray-300 mb-6">Oversee the platform, manage users, and maintain the competitive environment</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="mk-btn mk-btn-fight text-xl px-12 py-4 inline-flex items-center gap-3"
              >
                <Shield className="w-6 h-6" />
                Begin Your Journey
                <Shield className="w-6 h-6" />
              </button>
              <p className="text-gray-400 mt-4 text-sm mk-text-shadow">Choose your role after logging in</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}