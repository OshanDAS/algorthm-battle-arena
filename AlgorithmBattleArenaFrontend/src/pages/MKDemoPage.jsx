import React, { useState } from 'react';
import MKMainMenu from '../components/MKMainMenu';
import MKFighterSelect from '../components/MKFighterSelect';
import MKBattleScreen from '../components/MKBattleScreen';
import '../styles/mortal-kombat-theme.css';

export default function MKDemoPage() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // menu, select, battle
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [opponent, setOpponent] = useState(null);

  const handleStartGame = () => {
    setCurrentScreen('select');
  };

  const handleFighterSelected = (fighter) => {
    setSelectedFighter(fighter);
    
    // Auto-select a random opponent for demo
    const opponents = [
      {
        id: 'ai-python',
        name: 'AI Python Master',
        color: '#3776ab',
        stats: { speed: 88, power: 92, defense: 85 }
      },
      {
        id: 'ai-javascript',
        name: 'AI JS Overlord',
        color: '#f7df1e',
        stats: { speed: 92, power: 85, defense: 78 }
      }
    ];
    
    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    setOpponent(randomOpponent);
    setCurrentScreen('battle');
  };

  const handleBattleEnd = () => {
    setCurrentScreen('menu');
    setSelectedFighter(null);
    setOpponent(null);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleSettings = () => {
    alert('Settings menu would open here');
  };

  const handleExit = () => {
    if (window.confirm('Exit to main application?')) {
      // Navigate back to main app
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {currentScreen === 'menu' && (
        <MKMainMenu 
          onStartGame={handleStartGame}
          onSettings={handleSettings}
          onExit={handleExit}
        />
      )}
      
      {currentScreen === 'select' && (
        <MKFighterSelect 
          onFighterSelected={handleFighterSelected}
          onBack={handleBackToMenu}
        />
      )}
      
      {currentScreen === 'battle' && selectedFighter && opponent && (
        <MKBattleScreen 
          player1={selectedFighter}
          player2={opponent}
          onBattleEnd={handleBattleEnd}
        />
      )}
    </div>
  );
}