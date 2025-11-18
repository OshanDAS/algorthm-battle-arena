import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Clock, LogOut, Play, Send, ChevronDown, ChevronRight, CheckCircle, XCircle, MessageCircle, Zap, Shield, Sword, Target } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../services/auth';
import codeExecutor from '../services/codeExecutor';
import ResultsModal from '../components/ResultsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useChat } from '../hooks/useChat';
import '../styles/streetfighter-theme.css';

const MatchChatWindow = ({ conversationId, currentUserEmail, onSendMessage, messages }) => {
  const [newMessage, setNewMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  return (
    <div className="flex-1 flex flex-col bg-slate-900/50 rounded-lg border border-slate-600">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No messages yet. Chat with your opponents!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.senderEmail === currentUserEmail ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow-lg ${
                message.senderEmail === currentUserEmail 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                  : 'bg-slate-700 text-white border border-slate-600'
              }`}>
                {message.senderEmail !== currentUserEmail && (
                  <div className="text-xs text-gray-300 mb-1 font-medium">{message.senderName || message.senderEmail}</div>
                )}
                <div className="break-words">{message.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-600">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:bg-slate-600 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white p-2 rounded-xl transition-all shadow-lg disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>

            
  );
};

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
    const [code, setCode] = useState('// Write your code here\nconsole.log("Hello World");');
    const [language, setLanguage] = useState('javascript');
    const [problems, setProblems] = useState([]);
    const [activeProblem, setActiveProblem] = useState(null);
    const [expandedProblem, setExpandedProblem] = useState(null);
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [runResults, setRunResults] = useState(null);
    const [submitResults, setSubmitResults] = useState({});
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [currentResults, setCurrentResults] = useState(null);
    const [problemScores, setProblemScores] = useState({});
    const [submissionCounts, setSubmissionCounts] = useState({});
    const [pendingExit, setPendingExit] = useState(false);
    const [microCourse, setMicroCourse] = useState(null);
    const [microCourseLoading, setMicroCourseLoading] = useState(false);
    const [lastMicroCourseRequest, setLastMicroCourseRequest] = useState({}); // { [problemId]: timestamp }

    
    // Chat functionality
    const { messages, joinConversation, sendMessage, leaveConversation, conversations } = useChat();
    const [matchConversationId, setMatchConversationId] = useState(null);

    useEffect(() => {
        if (!match) {
            navigate('/lobby');
            return;
        }

        const fetchProblems = async () => {
            const problemDetails = await Promise.all(match.problemIds.map(id => apiService.problems.getById(id)));
            const problemsData = problemDetails.map(res => res.data);
            setProblems(problemsData);
            setActiveProblem(problemsData[0]);
            setExpandedProblem(problemsData[0]?.problemId);
        };

        const fetchSubmissions = async () => {
            try {
                const response = await apiService.submissions.getUserSubmissions(match.matchId);
                const submissions = response.data;
                const counts = {};
                submissions.forEach(sub => {
                    counts[sub.problemId] = (counts[sub.problemId] || 0) + 1;
                });
                setSubmissionCounts(counts);
            } catch (error) {
                console.error('Failed to fetch submissions:', error);
            }
        };

        fetchProblems();
        fetchSubmissions();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(match.startAtUtc).getTime();
            const duration = match.durationSec * 1000;
            const remainingTime = start + duration - now;
            setRemaining(remainingTime > 0 ? remainingTime : 0);
        }, 1000);

        return () => {
            clearInterval(interval);
            if (matchConversationId) {
                leaveConversation(matchConversationId);
            }
        };
    }, [match, navigate, matchConversationId, leaveConversation]);
    
    // Find and join match conversation
    useEffect(() => {
        const matchConv = conversations.find(c => c.type === 'Match' && c.referenceId === match?.matchId);
        if (matchConv && matchConv.conversationId !== matchConversationId) {
            setMatchConversationId(matchConv.conversationId);
            joinConversation(matchConv.conversationId);
        }
    }, [conversations, match?.matchId, matchConversationId, joinConversation]);
    
    const handleSendChatMessage = async (content) => {
        if (matchConversationId) {
            await sendMessage(matchConversationId, content);
        }
    };

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

    const handleRun = async () => {
        if (!activeProblem || isRunning) return;
        
        setIsRunning(true);
        setRunResults(null);
        
        try {
            // Get sample test cases only
            const sampleTestCases = activeProblem.testCases?.filter(tc => tc.isSample) || [];
            
            if (sampleTestCases.length === 0) {
                setRunResults({ error: 'No sample test cases available' });
                return;
            }
            
            const results = await codeExecutor.runSample(code, sampleTestCases);
            setRunResults(results);
        } catch (error) {
            setRunResults({ error: error.message });
        } finally {
            setIsRunning(false);
        }
    };

    // Clear run results when switching problems
    useEffect(() => {
        setRunResults(null);
    }, [activeProblem?.problemId]);

    const handleSubmit = async (isAutoSubmit = false, showModal = false) => {
        if (!activeProblem || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            // Run against all test cases
            const allTestCases = activeProblem.testCases || [];
            const results = await codeExecutor.runSubmission(code, allTestCases);
            
            // Submit to server
            await apiService.submissions.create({ 
                matchId: match.matchId, 
                problemId: activeProblem.problemId, 
                language, 
                code,
                score: results.score,
                status: results.allPassed ? 'Accepted' : 'Wrong Answer'
            });
            
            // Store results for display
            setSubmitResults(prev => ({
                ...prev,
                [activeProblem.problemId]: results
            }));
            
            // Update problem scores
            setProblemScores(prev => ({
                ...prev,
                [activeProblem.problemId]: results.score
            }));
            
            // Update submission count
            setSubmissionCounts(prev => ({
                ...prev,
                [activeProblem.problemId]: (prev[activeProblem.problemId] || 0) + 1
            }));
            
            if (!isAutoSubmit && showModal) {
                // Show results modal
                setCurrentResults(results);
                setShowResultsModal(true);
            }
        } catch (error) {
            console.error('Failed to submit solution:', error);
            setCurrentResults({ error: 'Failed to submit solution.' });
            setShowResultsModal(true);
        } finally {
            setIsSubmitting(false);
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

    const handleSubmitAndExit = async () => {
        if (!activeProblem || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            // Submit current solution silently
            const allTestCases = activeProblem.testCases || [];
            const results = await codeExecutor.runSubmission(code, allTestCases);
            
            await apiService.submissions.create({ 
                matchId: match.matchId, 
                problemId: activeProblem.problemId, 
                language, 
                code,
                score: results.score,
                status: results.allPassed ? 'Accepted' : 'Wrong Answer'
            });
            
            // Update states
            setSubmitResults(prev => ({
                ...prev,
                [activeProblem.problemId]: results
            }));
            
            setProblemScores(prev => ({
                ...prev,
                [activeProblem.problemId]: results.score
            }));
            
            setSubmissionCounts(prev => ({
                ...prev,
                [activeProblem.problemId]: (prev[activeProblem.problemId] || 0) + 1
            }));
        } catch (error) {
            console.error('Failed to submit solution:', error);
        } finally {
            setIsSubmitting(false);
        }
        
        // Show confirmation dialog directly
        setPendingExit(true);
        setShowConfirmDialog(true);
    };
    
    const handleConfirmExit = () => {
        setShowConfirmDialog(false);
        setPendingExit(false);
        handleBackToDashboard();
    };
    
    const handleCancelExit = () => {
        setShowConfirmDialog(false);
        setPendingExit(false);
    };
    
    const handleCloseResultsModal = () => {
        setShowResultsModal(false);
        setCurrentResults(null);
    };
    
    const handleSubmitAgain = () => {
        setShowResultsModal(false);
        setCurrentResults(null);
        // User can immediately submit again
    };

    if (!match || !activeProblem) return null;

    useEffect(() => {
        // Create floating embers for battle atmosphere
        const createEmber = () => {
            const ember = document.createElement('div');
            ember.className = 'ember';
            ember.style.left = Math.random() * 100 + '%';
            ember.style.animationDelay = Math.random() * 15 + 's';
            ember.style.animationDuration = (15 + Math.random() * 10) + 's';
            document.querySelector('.arena-embers')?.appendChild(ember);
            
            setTimeout(() => ember.remove(), 25000);
        };

        const emberInterval = setInterval(createEmber, 4000);
        return () => clearInterval(emberInterval);
    }, []);

    return (
        <div className="min-h-screen w-full arena-bg text-white flex flex-col p-4 relative">
            <div className="arena-embers"></div>
            <header className="arena-nav p-4 rounded-lg mb-6 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="battle-frame p-3 rounded-lg">
                            <Sword className="w-8 h-8 text-orange-400" style={{filter: 'drop-shadow(0 0 10px #ff4500)'}} />
                        </div>
                        <h1 className="arena-title text-3xl">Code Battle Arena</h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="battle-frame px-6 py-3 rounded-lg flex items-center space-x-3">
                            <Clock className="h-6 w-6 text-red-400" style={{filter: 'drop-shadow(0 0 8px #ff0040)'}} />
                            <span className="battle-timer text-2xl font-bold">{remaining !== null ? formatCountdown(remaining) : '...'}</span>
                        </div>
                        <button
                            onClick={async () => {
                                if (!activeProblem) return;
                                const pid = activeProblem.problemId;
                                const now = Date.now();
                                const last = lastMicroCourseRequest[pid] || 0;
                                // cooldown 60 seconds per problem
                                if (now - last < 60000) {
                                    alert('Please wait before requesting another micro-course for this problem.');
                                    return;
                                }
                                setMicroCourseLoading(true);
                                try {
                                    const resp = await apiService.problems.getMicroCourse(pid, { 
                                        timeLimitSeconds: match.durationSec, 
                                        remainingSec: Math.floor(remaining/1000), 
                                        language: language 
                                    });
                                    setMicroCourse(resp.data);
                                    setLastMicroCourseRequest(prev => ({ ...prev, [pid]: Date.now() }));
                                } catch (err) {
                                    console.error('Failed to fetch micro-course', err);
                                    if (err?.response) {
                                        console.error('Server responded with:', err.response.status, err.response.data);
                                    } else {
                                        console.error('Network or other error:', err.message);
                                    }
                                } finally {
                                    setMicroCourseLoading(false);
                                }
                            }}
                            className="battle-btn-cyan py-3 px-6 font-bold flex items-center space-x-2"
                        >
                            <Target className="h-5 w-5" />
                            <span>{microCourseLoading ? 'Loading...' : 'Battle Guide'}</span>
                        </button>
                        <button 
                            onClick={handleSubmitAndExit}
                            className="battle-btn-fire py-3 px-6 font-bold flex items-center space-x-2"
                        >
                            <Shield className="h-5 w-5" />
                            <span>Surrender</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                <div className="md:col-span-4 col-span-1 battle-frame p-6 rounded-lg max-h-[60vh] md:max-h-none overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="w-6 h-6 text-purple-400" style={{filter: 'drop-shadow(0 0 8px #bf00ff)'}} />
                        <h2 className="cyber-text text-xl font-bold">Battle Challenges</h2>
                    </div>
                    <div className="space-y-3">
                        {problems.map(p => {
                            const isExpanded = expandedProblem === p.problemId;
                            const isActive = activeProblem?.problemId === p.problemId;
                            const hasSubmission = submitResults[p.problemId];
                            
                            return (
                                <div key={p.problemId} className={`fighter-card rounded-lg ${isActive ? 'selected' : ''}`}>
                                    <div 
                                        onClick={() => {
                                            setActiveProblem(p);
                                            setExpandedProblem(isExpanded ? null : p.problemId);
                                        }}
                                        className="p-4 cursor-pointer flex items-center justify-between hover-lift"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Zap className="w-4 h-4 text-orange-400" />
                                            <span className="cyber-text font-medium">{p.title}</span>
                                            {submissionCounts[p.problemId] > 0 && (
                                                <span className="battle-badge text-xs px-2 py-1">
                                                    {submissionCounts[p.problemId]}
                                                </span>
                                            )}
                                            {hasSubmission && (
                                                hasSubmission.allPassed ? 
                                                    <CheckCircle className="h-5 w-5 text-green-400" style={{filter: 'drop-shadow(0 0 5px #00ff41)'}} /> :
                                                    <XCircle className="h-5 w-5 text-red-400" style={{filter: 'drop-shadow(0 0 5px #ff0040)'}} />
                                            )}
                                        </div>
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 bg-black/50 border-t border-green-500/30">
                                            <div className="mb-4">
                                                <h4 className="cyber-text text-sm font-semibold mb-2">Mission Brief</h4>
                                                <p className="text-gray-300 text-sm leading-relaxed">{p.description}</p>
                                            </div>
                                            
                                            {p.testCases?.filter(tc => tc.isSample).length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="cyber-text text-sm font-semibold mb-3">Battle Scenarios</h4>
                                                    {p.testCases.filter(tc => tc.isSample).map((tc, idx) => (
                                                        <div key={idx} className="mb-3 p-3 battle-frame rounded text-xs">
                                                            <div className="mb-2">
                                                                <span className="text-cyan-400 font-semibold">Input:</span>
                                                                <pre className="text-gray-300 mt-1 whitespace-pre-wrap break-words max-w-full bg-black/30 p-2 rounded">{tc.inputData}</pre>
                                                            </div>
                                                            <div>
                                                                <span className="text-green-400 font-semibold">Expected:</span>
                                                                <pre className="text-gray-300 mt-1 whitespace-pre-wrap break-words max-w-full bg-black/30 p-2 rounded">{tc.expectedOutput}</pre>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {runResults && isActive && (
                                                <div className="mb-4">
                                                    <h4 className="cyber-text text-sm font-semibold mb-3">Battle Results</h4>
                                                    <div className="battle-stats p-3 rounded text-xs">
                                                        {runResults.error ? (
                                                            <div className="text-red-400 font-semibold">{runResults.error}</div>
                                                        ) : (
                                                            <div>
                                                                <div className="text-green-400 font-semibold mb-2">
                                                                    Victory Rate: {runResults.passedCount}/{runResults.totalCount}
                                                                </div>
                                                                {runResults.results.map((result, idx) => (
                                                                    <div key={idx} className={`mb-2 p-2 rounded ${result.passed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                                        <div className="font-semibold">Battle {idx + 1}: {result.passed ? '⚔️ Victory' : '💀 Defeat'}</div>
                                                                        {!result.passed && (
                                                                            <div className="text-gray-400 ml-2 mt-1 text-xs">
                                                                                Expected: {result.expectedOutput}<br/>
                                                                                Your Output: {result.actualOutput}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="md:col-span-6 col-span-1 flex flex-col">
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
                        <button 
                            onClick={handleRun}
                            disabled={isRunning || !activeProblem}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2"
                        >
                            <Play className="h-4 w-4" />
                            <span>{isRunning ? 'Running...' : 'Run'}</span>
                        </button>
                        <button 
                            onClick={() => handleSubmit(false, true)}
                            disabled={isSubmitting || !activeProblem}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2"
                        >
                            <Send className="h-4 w-4" />
                            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
                        </button>
                    </div>
                </div>
                
                {/* Chat Column */}
                <div className="md:col-span-2 col-span-1 bg-slate-800 p-4 rounded-lg flex flex-col max-h-[60vh] md:max-h-none overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <MessageCircle className="mr-2" />
                        Match Chat
                    </h2>
                    
                    {matchConversationId ? (
                        <MatchChatWindow
                            conversationId={matchConversationId}
                            currentUserEmail={user?.email}
                            onSendMessage={handleSendChatMessage}
                            messages={messages[matchConversationId] || []}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <p>Loading chat...</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Results Modal */}
            <ResultsModal 
                isOpen={showResultsModal}
                onClose={handleCloseResultsModal}
                results={currentResults}
                onSubmitAgain={handleSubmitAgain}
            />
            
            {/* Exit Confirmation Dialog */}
            <ConfirmationDialog 
                isOpen={showConfirmDialog}
                onClose={handleCancelExit}
                onConfirm={handleConfirmExit}
                score={Object.values(problemScores).length > 0 
                    ? Math.round(Object.values(problemScores).reduce((a, b) => a + b, 0) / Object.values(problemScores).length)
                    : 0}
                problemsCompleted={Object.keys(submitResults).length}
                totalProblems={problems.length}
                timeRemaining={remaining || 0}
            />
            
            {/* Micro-course modal */}
            {microCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white text-black rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800">📚 Quick Micro-Course</h2>
                            <button 
                                onClick={() => setMicroCourse(null)} 
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6">
                                <p className="text-lg font-medium text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                    {microCourse.summary}
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {microCourse.steps && microCourse.steps.map((s, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                                                    {idx + 1}
                                                </span>
                                                {s.title}
                                            </h3>
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                {s.durationSec}s
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-3 leading-relaxed">{s.content}</p>
                                        
                                        {s.example && (
                                            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-3 rounded-r">
                                                <div className="flex items-center mb-1">
                                                    <span className="text-amber-600 font-medium text-sm">💡 Example:</span>
                                                </div>
                                                <p className="text-amber-800 text-sm">{s.example}</p>
                                            </div>
                                        )}
                                        
                                        {s.resources && s.resources.length > 0 && (
                                            <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
                                                <div className="flex items-center mb-2">
                                                    <span className="text-purple-600 font-medium text-sm">📖 Resources:</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {s.resources.map((resource, ridx) => (
                                                        <li key={ridx} className="text-purple-700 text-sm flex items-center">
                                                            <span className="text-purple-400 mr-2">•</span>
                                                            {resource}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {microCourse.disclaimer && (
                            <div className="p-4 bg-gray-100 border-t border-gray-200 rounded-b-xl">
                                <p className="text-xs text-gray-600 text-center italic">
                                    ⚠️ {microCourse.disclaimer}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}