import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CreateLobbyModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('New Lobby');
    const [maxPlayers, setMaxPlayers] = useState(10);
    const [mode, setMode] = useState('1v1');

    useEffect(() => {
        if (mode === '1v1') {
            setMaxPlayers(2);
        }
    }, [mode]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (name.trim() === '') return;
        onCreate({ name, maxPlayers, mode, difficulty: 'Medium' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6">Create New Lobby</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Lobby Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mode</label>
                        <select 
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        >
                            <option value="1v1">1v1</option>
                            <option value="Team">Team</option>
                            <option value="FreeForAll">Free For All</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Max Players</label>
                        <input 
                            type="number" 
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                            min="2"
                            max="20"
                            disabled={mode === '1v1'}
                            className="w-full bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:bg-slate-800 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-opacity"
                    >
                        Create Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}