import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Clock, LogOut, Play, Send, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../services/auth';
import codeExecutor from '../services/codeExecutor';
import ResultsModal from '../components/ResultsModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

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
                        {problems.map(p => {
                            const isExpanded = expandedProblem === p.problemId;
                            const isActive = activeProblem?.problemId === p.problemId;
                            const hasSubmission = submitResults[p.problemId];
                            
                            return (
                                <div key={p.problemId} className="border border-slate-600 rounded-lg">
                                    <div 
                                        onClick={() => {
                                            setActiveProblem(p);
                                            setExpandedProblem(isExpanded ? null : p.problemId);
                                        }}
                                        className={`p-3 cursor-pointer flex items-center justify-between ${
                                            isActive ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">{p.title}</span>
                                            {submissionCounts[p.problemId] > 0 && (
                                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                    {submissionCounts[p.problemId]}
                                                </span>
                                            )}
                                            {hasSubmission && (
                                                hasSubmission.allPassed ? 
                                                    <CheckCircle className="h-4 w-4 text-green-400" /> :
                                                    <XCircle className="h-4 w-4 text-red-400" />
                                            )}
                                        </div>
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 bg-slate-900 border-t border-slate-600">
                                            <div className="mb-3">
                                                <h4 className="font-semibold text-sm text-gray-300 mb-1">Description</h4>
                                                <p className="text-sm text-gray-400">{p.description}</p>
                                            </div>
                                            
                                            {p.testCases?.filter(tc => tc.isSample).length > 0 && (
                                                <div className="mb-3">
                                                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Sample Test Cases</h4>
                                                    {p.testCases.filter(tc => tc.isSample).map((tc, idx) => (
                                                        <div key={idx} className="mb-2 p-2 bg-slate-800 rounded text-xs">
                                                            <div className="mb-1">
                                                                <span className="text-blue-300">Input:</span>
                                                                <pre className="text-gray-300 mt-1">{tc.inputData}</pre>
                                                            </div>
                                                            <div>
                                                                <span className="text-green-300">Output:</span>
                                                                <pre className="text-gray-300 mt-1">{tc.expectedOutput}</pre>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {runResults && isActive && (
                                                <div className="mb-3">
                                                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Run Results</h4>
                                                    <div className="p-2 bg-slate-800 rounded text-xs">
                                                        {runResults.error ? (
                                                            <div className="text-red-400">{runResults.error}</div>
                                                        ) : (
                                                            <div>
                                                                <div className="text-green-300 mb-1">
                                                                    Passed: {runResults.passedCount}/{runResults.totalCount}
                                                                </div>
                                                                {runResults.results.map((result, idx) => (
                                                                    <div key={idx} className={`mb-1 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                                        Test {idx + 1}: {result.passed ? '✓' : '✗'}
                                                                        {!result.passed && (
                                                                            <div className="text-gray-400 ml-2">
                                                                                Expected: {result.expectedOutput}<br/>
                                                                                Got: {result.actualOutput}
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
        </div>
    );
}