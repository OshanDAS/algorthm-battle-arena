import React, { useState, useEffect } from 'react';
import '../styles/mortal-kombat-theme.css';

export default function MKFighterSelect({ onFighterSelected, onBack }) {
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [hoveredFighter, setHoveredFighter] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fighters = [
    {
      id: 'python-warrior',
      name: 'Python Warrior',
      description: 'Master of elegant syntax and powerful libraries',
      stats: { speed: 85, power: 90, defense: 75 },
      color: '#3776ab',
      specialty: 'Data Manipulation'
    },
    {
      id: 'javascript-ninja',
      name: 'JavaScript Ninja',
      description: 'Swift and versatile, adapts to any environment',
      stats: { speed: 95, power: 80, defense: 70 },
      color: '#f7df1e',
      specialty: 'Async Combat'
    },
    {
      id: 'java-champion',
      name: 'Java Champion',
      description: 'Strong and reliable, built for enterprise battles',
      stats: { speed: 70, power: 85, defense: 95 },
      color: '#ed8b00',
      specialty: 'Object Mastery'
    },
    {
      id: 'cpp-berserker',
      name: 'C++ Berserker',
      description: 'Raw power and speed, close to the metal',
      stats: { speed: 90, power: 95, defense: 65 },
      color: '#00599c',
      specialty: 'Memory Control'
    },
    {
      id: 'rust-guardian',
      name: 'Rust Guardian',
      description: 'Memory safe and blazingly fast',
      stats: { speed: 88, power: 92, defense: 90 },
      color: '#ce422b',
      specialty: 'Safe Concurrency'
    },
    {
      id: 'go-speedster',
      name: 'Go Speedster',
      description: 'Simple, fast, and concurrent',
      stats: { speed: 93, power: 78, defense: 80 },
      color: '#00add8',
      specialty: 'Goroutine Rush'
    }
  ];

  const handleFighterClick = (fighter) => {
    setSelectedFighter(fighter);
    setShowConfirm(true);
  };

  const confirmSelection = () => {
    onFighterSelected(selectedFighter);
  };

  const StatBar = ({ label, value, color }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="mk-text-shadow">{label}</span>
        <span className="mk-text-shadow">{value}</span>
      </div>
      <div className="mk-health-bar h-3">
        <div 
          className="mk-health-fill h-full"
          style={{ 
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, #FFD700)`
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="mk-arena">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mk-title text-4xl mb-4">Choose Your Fighter</h1>
          <div className="mk-score">Select your programming language warrior</div>
        </div>

        {/* Fighter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {fighters.map((fighter) => (
            <div
              key={fighter.id}
              className={`mk-fighter-card p-6 cursor-pointer transition-all duration-300 ${
                selectedFighter?.id === fighter.id ? 'selected' : ''
              }`}
              onClick={() => handleFighterClick(fighter)}
              onMouseEnter={() => setHoveredFighter(fighter)}
              onMouseLeave={() => setHoveredFighter(null)}
            >
              {/* Fighter Portrait */}
              <div className="mk-portrait w-full h-48 mb-4 flex items-center justify-center">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{ 
                    backgroundColor: fighter.color,
                    color: '#000',
                    boxShadow: `0 0 20px ${fighter.color}`
                  }}
                >
                  {fighter.name.charAt(0)}
                </div>
              </div>

              {/* Fighter Info */}
              <h3 className="text-xl font-bold mb-2 mk-text-shadow text-center" style={{ color: fighter.color }}>
                {fighter.name}
              </h3>
              <p className="text-sm text-gray-300 mb-4 text-center">
                {fighter.description}
              </p>
              
              {/* Specialty */}
              <div className="text-center mb-4">
                <span className="mk-score text-xs px-3 py-1 rounded">
                  {fighter.specialty}
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <StatBar label="Speed" value={fighter.stats.speed} color={fighter.color} />
                <StatBar label="Power" value={fighter.stats.power} color={fighter.color} />
                <StatBar label="Defense" value={fighter.stats.defense} color={fighter.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Fighter Details Panel */}
        {(hoveredFighter || selectedFighter) && (
          <div className="mk-combat-frame p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 mk-text-shadow" 
                    style={{ color: (hoveredFighter || selectedFighter).color }}>
                  {(hoveredFighter || selectedFighter).name}
                </h3>
                <p className="text-gray-300 mb-4">
                  {(hoveredFighter || selectedFighter).description}
                </p>
                <div className="mk-score text-sm">
                  Specialty: {(hoveredFighter || selectedFighter).specialty}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4 mk-text-shadow">Combat Stats</h4>
                <StatBar 
                  label="Speed" 
                  value={(hoveredFighter || selectedFighter).stats.speed} 
                  color={(hoveredFighter || selectedFighter).color} 
                />
                <StatBar 
                  label="Power" 
                  value={(hoveredFighter || selectedFighter).stats.power} 
                  color={(hoveredFighter || selectedFighter).color} 
                />
                <StatBar 
                  label="Defense" 
                  value={(hoveredFighter || selectedFighter).stats.defense} 
                  color={(hoveredFighter || selectedFighter).color} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button className="mk-btn" onClick={onBack}>
            Back to Menu
          </button>
          {selectedFighter && (
            <button className="mk-btn mk-btn-fight" onClick={confirmSelection}>
              Enter Battle!
            </button>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && selectedFighter && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="mk-combat-frame p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4 text-center mk-text-shadow">
                Confirm Fighter Selection
              </h3>
              <div className="text-center mb-6">
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold"
                  style={{ 
                    backgroundColor: selectedFighter.color,
                    color: '#000',
                    boxShadow: `0 0 20px ${selectedFighter.color}`
                  }}
                >
                  {selectedFighter.name.charAt(0)}
                </div>
                <h4 className="text-xl font-bold mk-text-shadow" style={{ color: selectedFighter.color }}>
                  {selectedFighter.name}
                </h4>
              </div>
              <div className="flex gap-4">
                <button 
                  className="mk-btn flex-1" 
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="mk-btn mk-btn-fight flex-1" 
                  onClick={confirmSelection}
                >
                  Fight!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}