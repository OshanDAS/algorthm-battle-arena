import React, { useState, useEffect, useRef } from 'react';
import '../styles/mortal-kombat-theme.css';

export default function MKBattleScreen({ 
  player1, 
  player2, 
  onBattleEnd,
  battleData = null 
}) {
  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [p1Rounds, setP1Rounds] = useState(0);
  const [p2Rounds, setP2Rounds] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [battlePhase, setBattlePhase] = useState('ready'); // ready, fighting, roundEnd, gameEnd
  const [combo, setCombo] = useState(0);
  const [lastHit, setLastHit] = useState(null);
  const [showFatality, setShowFatality] = useState(false);
  const [timer, setTimer] = useState(99);
  const battleRef = useRef();

  useEffect(() => {
    let interval;
    if (battlePhase === 'fighting' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setBattlePhase('roundEnd');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [battlePhase, timer]);

  useEffect(() => {
    if (battlePhase === 'ready') {
      const timeout = setTimeout(() => {
        setBattlePhase('fighting');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [battlePhase]);

  const createBloodSplatter = (x, y) => {
    const splatter = document.createElement('div');
    splatter.className = 'mk-blood-splatter';
    splatter.style.left = `${x}px`;
    splatter.style.top = `${y}px`;
    battleRef.current?.appendChild(splatter);
    
    setTimeout(() => {
      splatter.remove();
    }, 500);
  };

  const dealDamage = (target, damage) => {
    const hitX = Math.random() * window.innerWidth;
    const hitY = Math.random() * window.innerHeight * 0.6;
    createBloodSplatter(hitX, hitY);

    if (target === 'p1') {
      setP1Health(prev => Math.max(0, prev - damage));
      setLastHit('p1');
    } else {
      setP2Health(prev => Math.max(0, prev - damage));
      setLastHit('p2');
    }

    setCombo(prev => prev + 1);
    setTimeout(() => setLastHit(null), 500);
  };

  const simulateBattle = () => {
    if (battlePhase !== 'fighting') return;

    const actions = [
      () => dealDamage('p1', Math.random() * 15 + 5),
      () => dealDamage('p2', Math.random() * 15 + 5),
      () => {}, // miss
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();
  };

  useEffect(() => {
    if (battlePhase === 'fighting') {
      const interval = setInterval(simulateBattle, 1000 + Math.random() * 2000);
      return () => clearInterval(interval);
    }
  }, [battlePhase]);

  useEffect(() => {
    if (p1Health <= 0 || p2Health <= 0) {
      setBattlePhase('roundEnd');
      if (p1Health <= 0) {
        setP2Rounds(prev => prev + 1);
      } else {
        setP1Rounds(prev => prev + 1);
      }
    }
  }, [p1Health, p2Health]);

  useEffect(() => {
    if (p1Rounds >= 2 || p2Rounds >= 2) {
      setBattlePhase('gameEnd');
      if (p1Rounds >= 2 && p2Health <= 0) {
        setShowFatality(true);
      } else if (p2Rounds >= 2 && p1Health <= 0) {
        setShowFatality(true);
      }
    }
  }, [p1Rounds, p2Rounds, p1Health, p2Health]);

  const startNextRound = () => {
    setP1Health(100);
    setP2Health(100);
    setCurrentRound(prev => prev + 1);
    setTimer(99);
    setCombo(0);
    setBattlePhase('ready');
  };

  const HealthBar = ({ health, isPlayer1, color }) => (
    <div className={`mk-health-bar ${isPlayer1 ? 'mr-4' : 'ml-4'}`}>
      <div 
        className="mk-health-fill"
        style={{ 
          width: `${health}%`,
          background: `linear-gradient(90deg, ${color}, #FFD700)`
        }}
      />
    </div>
  );

  const RoundPips = ({ rounds, isPlayer1 }) => (
    <div className={`mk-round ${isPlayer1 ? 'justify-start' : 'justify-end'}`}>
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className={`mk-round-pip ${i < rounds ? 'won' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="mk-arena" ref={battleRef}>
      {/* Battle UI */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        {/* Top HUD */}
        <div className="flex items-center justify-between mb-4">
          {/* Player 1 */}
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="mk-score text-lg mr-4" style={{ color: player1.color }}>
                {player1.name}
              </div>
              <RoundPips rounds={p1Rounds} isPlayer1={true} />
            </div>
            <HealthBar health={p1Health} isPlayer1={true} color={player1.color} />
          </div>

          {/* Timer */}
          <div className="mx-8">
            <div className="mk-score text-4xl">
              {timer.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Player 2 */}
          <div className="flex-1">
            <div className="flex items-center mb-2 justify-end">
              <RoundPips rounds={p2Rounds} isPlayer1={false} />
              <div className="mk-score text-lg ml-4" style={{ color: player2.color }}>
                {player2.name}
              </div>
            </div>
            <HealthBar health={p2Health} isPlayer1={false} color={player2.color} />
          </div>
        </div>

        {/* Round Display */}
        <div className="text-center">
          <div className="mk-score text-xl">
            Round {currentRound}
          </div>
        </div>
      </div>

      {/* Fighter Positions */}
      <div className="flex items-center justify-between h-screen px-16">
        {/* Player 1 Fighter */}
        <div className={`mk-portrait w-48 h-64 ${lastHit === 'p1' ? 'animate-pulse' : ''}`}>
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center text-6xl font-bold"
            style={{ 
              backgroundColor: player1.color,
              color: '#000',
              boxShadow: `0 0 30px ${player1.color}`
            }}
          >
            {player1.name.charAt(0)}
          </div>
        </div>

        {/* VS Display */}
        <div className="text-center">
          {battlePhase === 'ready' && (
            <div className="mk-vs-text">
              {currentRound === 1 ? 'FIGHT!' : `ROUND ${currentRound}`}
            </div>
          )}
          {combo > 3 && (
            <div className="mk-combo">
              {combo} HIT COMBO!
            </div>
          )}
        </div>

        {/* Player 2 Fighter */}
        <div className={`mk-portrait w-48 h-64 ${lastHit === 'p2' ? 'animate-pulse' : ''}`}>
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center text-6xl font-bold"
            style={{ 
              backgroundColor: player2.color,
              color: '#000',
              boxShadow: `0 0 30px ${player2.color}`
            }}
          >
            {player2.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Battle Controls */}
      {battlePhase === 'fighting' && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-4">
            <button 
              className="mk-btn"
              onClick={() => dealDamage('p2', 20)}
            >
              Attack P2
            </button>
            <button 
              className="mk-btn"
              onClick={() => dealDamage('p1', 20)}
            >
              Attack P1
            </button>
          </div>
        </div>
      )}

      {/* Round End Screen */}
      {battlePhase === 'roundEnd' && !showFatality && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mk-vs-text mb-8">
              {p1Health > p2Health ? `${player1.name} WINS` : `${player2.name} WINS`}
            </div>
            {(p1Rounds < 2 && p2Rounds < 2) ? (
              <button className="mk-btn mk-btn-fight" onClick={startNextRound}>
                Next Round
              </button>
            ) : (
              <button className="mk-btn mk-btn-fight" onClick={onBattleEnd}>
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fatality Screen */}
      {showFatality && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mk-fatality mb-8">
              FATALITY!
            </div>
            <div className="mk-vs-text text-4xl mb-8">
              {p1Rounds >= 2 ? `${player1.name} WINS` : `${player2.name} WINS`}
            </div>
            <button className="mk-btn mk-btn-fight" onClick={onBattleEnd}>
              Return to Menu
            </button>
          </div>
        </div>
      )}

      {/* Game End Screen */}
      {battlePhase === 'gameEnd' && !showFatality && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mk-vs-text mb-8">
              {p1Rounds >= 2 ? `${player1.name} WINS` : `${player2.name} WINS`}
            </div>
            <div className="mk-score text-xl mb-8">
              Final Score: {p1Rounds} - {p2Rounds}
            </div>
            <button className="mk-btn mk-btn-fight" onClick={onBattleEnd}>
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}