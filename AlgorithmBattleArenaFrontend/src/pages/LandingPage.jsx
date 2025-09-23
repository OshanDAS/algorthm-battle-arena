import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sword, Users, BookOpen, Shield, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-blue-200/40">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sword className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-wider">
                Algorithm Battle Arena
              </h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 tracking-wider">
                Algorithm Battle Arena
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Welcome to the ultimate competitive programming platform where students battle with code, 
                teachers create challenges, and administrators oversee the arena.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Students */}
              <div className="group bg-white/90 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Students</h3>
                <p className="text-gray-600 mb-6">Join coding battles, compete with peers, and master algorithms through interactive challenges</p>
              </div>

              {/* Teachers */}
              <div className="group bg-white/90 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Teachers</h3>
                <p className="text-gray-600 mb-6">Create challenges, manage students, and guide the next generation of programmers</p>
              </div>

              {/* Admins */}
              <div className="group bg-white/90 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Administrators</h3>
                <p className="text-gray-600 mb-6">Oversee the platform, manage users, and maintain the competitive environment</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-3 px-12 py-4 text-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Shield className="w-6 h-6" />
                Begin Your Journey
                <Shield className="w-6 h-6" />
              </button>
              <p className="text-gray-500 mt-4 text-sm">Choose your role after logging in</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}