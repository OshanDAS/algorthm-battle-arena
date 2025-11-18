import React, { useState, useEffect } from 'react';
import '../styles/mortal-kombat-theme.css';

export default function MKMainMenu({ onStartGame, onSettings, onExit }) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [showLightning, setShowLightning] = useState(false);

  const menuOptions = [
    { label: 'Start Battle', action: onStartGame },
    { label: 'Tournament', action: () => console.log('Tournament') },
    { label: 'Training', action: () => console.log('Training') },
    { label: 'Settings', action: onSettings },
    { label: 'Exit Arena', action: onExit }
  ];

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp') {
        setSelectedOption(prev => prev > 0 ? prev - 1 : menuOptions.length - 1);
      } else if (e.key === 'ArrowDown') {
        setSelectedOption(prev => prev < menuOptions.length - 1 ? prev + 1 : 0);
      } else if (e.key === 'Enter') {
        menuOptions[selectedOption].action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOption, menuOptions]);

  useEffect(() => {
    const lightningInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 200);
      }
    }, 2000);

    return () => clearInterval(lightningInterval);
  }, []);

  return (
    <div className="mk-arena">
      {showLightning && (
        <div 
          className="mk-lightning" 
          style={{ left: `${Math.random() * 100}%` }}
        />
      )}
      
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h1 className="mk-title mb-4">
            Algorithm Battle Arena
          </h1>
          <div className="mk-score text-xl">
            Choose Your Destiny
          </div>
        </div>

        {/* Main Menu */}
        <div className="mk-menu w-full max-w-md">
          {menuOptions.map((option, index) => (
            <div
              key={index}
              className={`mk-menu-item ${index === selectedOption ? 'active' : ''}`}
              onClick={() => {
                setSelectedOption(index);
                option.action();
              }}
              onMouseEnter={() => setSelectedOption(index)}
            >
              {option.label}
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-16 text-center">
          <div className="mk-score text-sm">
            Use ↑↓ arrows and Enter to navigate
          </div>
        </div>
      </div>

      {/* Floating Embers */}
      <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="mk-blood-splatter"
            style={{
              left: `${20 + i * 15}%`,
              bottom: `${Math.random() * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              animationIterationCount: 'infinite'
            }}
          />
        ))}
      </div>
    </div>
  );
}