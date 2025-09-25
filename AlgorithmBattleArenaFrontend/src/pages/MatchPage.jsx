import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Clock, LogOut } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../services/auth';

function formatCountdown(ms) {
    if (ms <= 0) return '00:00';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function MatchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const match = location.state?.match;

    const [remaining, setRemaining] = useState(null);
    const [code, setCode] = useState('// Write your code here');
    const [language, setLanguage] = useState('javascript');
    const [problems, setProblems] = useState([]);
    const [activeProblem, setActiveProblem] = useState(null);
    const [autoSubmitted, setAutoSubmitted] = useState(false);

    useEffect(() => {
        if (!match) {
            navigate('/lobby');
            return;
        }

        const fetchProblems = async () => {
            const problemDetails = await Promise.all(match.problemIds.map(id => apiService.problems.getById(id)));
            setProblems(problemDetails.map(res => res.data));
            setActiveProblem(problemDetails[0].data);
        };

        fetchProblems();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(match.startAtUtc).getTime();
            const duration = match.durationSec * 1000;
            const remainingTime = start + duration - now;
            setRemaining(remainingTime > 0 ? remainingTime : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [match, navigate]);

    useEffect(() => {
        if (remaining === 0 && !autoSubmitted) {
            setAutoSubmitted(true);
            handleSubmit(true).then(() => {
                setTimeout(() => {
                    handleBackToDashboard();
                }, 2000);
            });
        }
    }, [remaining, autoSubmitted]);

    const handleSubmit = async (isAutoSubmit = false) => {
        if (!activeProblem) return;
        try {
            await apiService.submissions.create({ 
                matchId: match.matchId, 
                problemId: activeProblem.problemId, 
                language, 
                code 
            });
            alert(`Solution submitted${isAutoSubmit ? ' automatically as time expired.' : '!'}`);
        } catch (error) {
            console.error('Failed to submit solution:', error);
            alert('Failed to submit solution.');
        }
    };

    const handleBackToDashboard = () => {
        switch (user.role) {
            case 'Admin':
                navigate('/admin');
                break;
            case 'Teacher':
                navigate('/teacher');
                break;
            case 'Student':
                navigate('/student-dashboard');
                break;
            default:
                navigate('/dashboard');
        }
    };

    const handleSubmitAndExit = async () => {        if (window.confirm('Are you sure you want to submit and exit? You cannot come back to the match.')) {
            await handleSubmit();
            handleBackToDashboard();
        }
    };

    if (!match || !activeProblem) return null;

    return (
        <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col p-4">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Algorithm Battle</h1>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-lg">
                        <Clock className="h-6 w-6" />
                        <span className="text-xl font-bold">{remaining !== null ? formatCountdown(remaining) : '...'}</span>
                    </div>
                    <button 
                        onClick={handleSubmitAndExit}
                        className="bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-2"
                    >
                        <LogOut className="h-6 w-6" />
                        <span>Submit and Exit</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-4">
                <div className="col-span-4 bg-slate-800 p-4 rounded-lg overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Problems</h2>
                    <div className="space-y-2">
                        {problems.map(p => (
                            <div key={p.problemId} onClick={() => setActiveProblem(p)} className={`p-3 rounded-lg cursor-pointer ${activeProblem.problemId === p.problemId ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                {p.title}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border-t border-slate-700 pt-4">
                        <h3 className="text-lg font-bold">{activeProblem.title}</h3>
                        <p className="mt-2 text-sm text-gray-300">{activeProblem.description}</p>
                    </div>
                </div>

                <div className="col-span-8 flex flex-col">
                    <div className="flex justify-end mb-2">
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-slate-700 text-white rounded-lg p-2"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="csharp">C#</option>
                        </select>
                    </div>
                    <div className="flex-1 rounded-lg overflow-hidden">
                        <Editor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={setCode}
                        />
                    </div>
                    <div className="mt-4 flex justify-end space-x-4">
                        <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}