import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiService from '../services/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiService.statistics.getLeaderboard();
      setLeaderboard(response.data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-blue-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
        <div className="text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center space-x-4">
              <Link 
                to="/student-dashboard" 
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">Leaderboard</h1>
            <p className="text-gray-300 mt-1">Top performers in Algorithm Battle Arena</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Problems Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                    Matches Played
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/10">
                {leaderboard.map((entry) => (
                  <tr key={entry.participantEmail} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeColor(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {entry.participantEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {entry.totalScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {entry.problemsCompleted}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-300">
                        {entry.matchesPlayed}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-300">
                        {entry.winRate}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-400">
                      {new Date(entry.lastSubmission).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {leaderboard.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-300">No leaderboard data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;