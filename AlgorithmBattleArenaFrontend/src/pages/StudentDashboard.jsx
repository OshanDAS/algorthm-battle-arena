import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, User, Users, Trophy, Swords, PlayCircle, LogOut, TrendingUp, UserPlus, Calendar, Settings, Home, Medal, Search, X, Check, MessageCircle } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../services/auth';
import ContactsSection from '../components/ContactsSection';
import ChatIcon from '../components/ChatIcon';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl flex items-center space-x-4 transform hover:scale-105 transition-transform duration-300">
    {icon}
    <div>
      <p className="text-gray-300">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const FriendListItem = ({ friend, onRemove, onChatStart }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
    <div className="flex items-center space-x-3">
      <User className="h-8 w-8 text-gray-400" />
      <div>
        <p className="text-white">{friend.fullName}</p>
        <p className="text-gray-400 text-sm">{friend.email}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <div className={`h-3 w-3 rounded-full ${friend.isOnline ? 'bg-green-400' : 'bg-gray-600'}`}></div>
      <ChatIcon 
        user={friend} 
        onChatStart={onChatStart}
        className="w-8 h-8"
      />
      <button 
        onClick={() => onRemove(friend.studentId)}
        className="text-red-400 hover:text-red-300 p-1"
        title="Remove friend"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const LobbyContestItem = ({ name, participants, buttonText }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
    <div>
        <p className="text-white">{name}</p>
        <div className="flex items-center space-x-2 mt-1">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300 text-sm">{participants}</span>
        </div>
    </div>
    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
        {buttonText}
    </button>
  </div>
);

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ rank: 0, matchesPlayed: 0, winRate: 0 });
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  
  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ received: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  


  useEffect(() => {
    fetchUserStats();
    fetchProfile();
    fetchLeaderboard();
    fetchTeachers();
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await apiService.statistics.getUserStatistics();
      setStats({
        rank: response.data.rank || 0,
        matchesPlayed: response.data.matchesPlayed || 0,
        winRate: Math.round(response.data.winRate || 0)
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiService.auth.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await apiService.statistics.getLeaderboard();
      console.log('Leaderboard data:', response.data); // Debug log
      setLeaderboard(Array.isArray(response.data) ? response.data.slice(0, 5) : []); // Top 5
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]); // Set empty array on error
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await apiService.teachers.getAll();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleRequestTeacher = async (teacherId) => {
    try {
      await apiService.students.requestTeacher(teacherId);
      alert('Teacher request sent successfully!');
      setShowTeacherModal(false);
    } catch (error) {
      console.error('Error requesting teacher:', error);
      alert('Failed to send teacher request.');
    }
  };

  // Friends functions
  const fetchFriends = async () => {
    try {
      const response = await apiService.friends.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const [received, sent] = await Promise.all([
        apiService.friends.getReceivedRequests(),
        apiService.friends.getSentRequests()
      ]);
      setFriendRequests({ received: received.data, sent: sent.data });
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchStudents = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setFriendsLoading(true);
    try {
      const response = await apiService.friends.searchStudents(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      await apiService.friends.sendFriendRequest(receiverId);
      alert('Friend request sent!');
      fetchFriendRequests();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request.');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await apiService.friends.acceptFriendRequest(requestId);
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await apiService.friends.rejectFriendRequest(requestId);
      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const removeFriend = async (friendId) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await apiService.friends.removeFriend(friendId);
        fetchFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  const handleChatStart = (conversationId) => {
    setSelectedConversationId(conversationId);
    setShowChat(true);
  };

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'battle', label: 'Battle', icon: Swords },
    { id: 'contests', label: 'Contests', icon: Calendar },
    { id: 'friends', label: 'Contacts', icon: UserPlus },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {profile?.fullName || user?.email || 'Student'}! 👋
              </h2>
              <p className="text-gray-300 text-lg">
                Ready to challenge yourself? Join a contest or start a battle to improve your coding skills.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<Trophy className="h-10 w-10 text-yellow-400" />} label="Current Rank" value={loading ? "..." : `#${stats.rank}`} />
              <StatCard icon={<BarChart className="h-10 w-10 text-blue-400" />} label="Matches Played" value={loading ? "..." : stats.matchesPlayed} />
              <StatCard icon={<Medal className="h-10 w-10 text-green-400" />} label="Win Rate" value={loading ? "..." : `${stats.winRate}%`} />
            </div>

            {/* Active Contests */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">🏆 Active Contests</h3>
                <button 
                  onClick={() => setActiveTab('contests')}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-400/30">
                  <h4 className="text-white font-semibold mb-2">Weekly Challenge #12</h4>
                  <p className="text-gray-300 text-sm mb-3">128 participants • Ends in 2 days</p>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg">
                    Join Contest
                  </button>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-400/30">
                  <h4 className="text-white font-semibold mb-2">Algorithm Masters</h4>
                  <p className="text-gray-300 text-sm mb-3">256 participants • Ends in 5 days</p>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg">
                    Join Contest
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">⚡ Quick Battle</h3>
                <p className="text-gray-300 mb-4">Jump into a quick coding challenge</p>
                <Link to="/lobby" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                  <Swords className="h-5 w-5" />
                  <span>Start Battle</span>
                </Link>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">🏅 Top 3 Leaderboard</h3>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 3).map((entry, index) => (
                      <div key={entry.participantEmail || index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' : 
                            index === 1 ? 'bg-gray-400 text-white' : 
                            'bg-amber-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {entry.studentName || entry.participantEmail || entry.fullName || 'Unknown'}
                            </p>
                            {entry.participantEmail && entry.studentName && (
                              <p className="text-gray-400 text-xs">{entry.participantEmail}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-semibold">
                            {entry.totalScore || entry.score || '0'} pts
                          </p>
                          {entry.winRate && (
                            <p className="text-gray-300 text-xs">{entry.winRate}% win</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-300">No leaderboard data available</p>
                  </div>
                )}
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<Trophy className="h-10 w-10 text-yellow-400" />} label="Rank" value={loading ? "..." : `#${stats.rank}`} />
              <StatCard icon={<BarChart className="h-10 w-10 text-blue-400" />} label="Matches Played" value={loading ? "..." : stats.matchesPlayed} />
              <StatCard icon={<Swords className="h-10 w-10 text-red-400" />} label="Win Rate" value={loading ? "..." : `${stats.winRate}%`} />
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Top Performers</h3>
              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 text-gray-300 text-sm font-medium">Rank</th>
                        <th className="text-left py-2 text-gray-300 text-sm font-medium">Player</th>
                        <th className="text-right py-2 text-gray-300 text-sm font-medium">Score</th>
                        <th className="text-right py-2 text-gray-300 text-sm font-medium">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 5).map((entry, index) => (
                        <tr key={entry.participantEmail || index} className="border-b border-white/5">
                          <td className="py-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' : 
                              index === 1 ? 'bg-gray-400 text-white' : 
                              index === 2 ? 'bg-amber-600 text-white' :
                              'bg-blue-500 text-white'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="text-white text-sm font-medium">
                                {entry.studentName || entry.participantEmail || entry.fullName || 'Unknown'}
                              </p>
                              {entry.participantEmail && entry.studentName && (
                                <p className="text-gray-400 text-xs">{entry.participantEmail}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-white font-semibold">
                              {entry.totalScore || entry.score || '0'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-gray-300">
                              {entry.winRate || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-300">No leaderboard data available</p>
                  <p className="text-gray-400 text-sm mt-1">Start playing matches to see rankings</p>
                </div>
              )}
              <Link to="/leaderboard" className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg">
                View Full Leaderboard
              </Link>
            </div>
          </div>
        );
      case 'friends':
        return (
          <div className="space-y-6">
            {/* Friends List */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Contacts ({friends.length})</h3>
                <button 
                  onClick={() => setShowAddFriendModal(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Friends</span>
                </button>
              </div>
              <div className="space-y-3">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <FriendListItem key={friend.studentId} friend={friend} onRemove={removeFriend} onChatStart={handleChatStart} />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-300">No friends yet</p>
                    <p className="text-gray-400 text-sm mt-1">Start by adding some friends!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Friend Requests */}
            {friendRequests.received.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Friend Requests ({friendRequests.received.length})</h3>
                <div className="space-y-3">
                  {friendRequests.received.map((request) => (
                    <div key={request.requestId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-white">{request.senderName}</p>
                          <p className="text-gray-400 text-sm">{request.senderEmail}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => acceptFriendRequest(request.requestId)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                          title="Accept"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => rejectFriendRequest(request.requestId)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <ContactsSection studentId={profile?.id} friends={friends} />
            
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Request Teacher</h3>
              <p className="text-gray-300 mb-4">Connect with a teacher to get guidance and track your progress.</p>
              <button 
                onClick={() => setShowTeacherModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
              >
                Browse Teachers
              </button>
            </div>
            
            {/* Add Friend Modal */}
            {showAddFriendModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Add Friends</h3>
                    <button 
                      onClick={() => {
                        setShowAddFriendModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchStudents(e.target.value);
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {friendsLoading ? (
                      <p className="text-gray-300 text-center py-4">Searching...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((student) => (
                        <div key={student.studentId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <User className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="text-white text-sm">{student.fullName}</p>
                              <p className="text-gray-400 text-xs">{student.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => sendFriendRequest(student.studentId)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-1 px-3 rounded text-sm transition-all duration-200"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    ) : searchQuery.trim() ? (
                      <p className="text-gray-300 text-center py-4">No students found</p>
                    ) : (
                      <p className="text-gray-400 text-center py-4">Start typing to search for students</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Teacher Selection Modal */}
            {showTeacherModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Select a Teacher</h3>
                    <button 
                      onClick={() => setShowTeacherModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {teachers.map((teacher) => (
                      <div key={teacher.teacherId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{teacher.fullName}</p>
                          <p className="text-gray-300 text-sm">{teacher.email}</p>
                        </div>
                        <button 
                          onClick={() => handleRequestTeacher(teacher.teacherId)}
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg"
                        >
                          Request
                        </button>
                      </div>
                    ))}
                  </div>
                  {teachers.length === 0 && (
                    <p className="text-gray-300 text-center py-4">No teachers available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'contests':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Active Contests</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Weekly Challenge #12</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">128 participants</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Participate
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Weekend Sprint</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">64 participants</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Participate
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Algorithm Masters</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">256 participants</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Participate
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Upcoming Contests</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white font-medium">Monthly Championship</p>
                  <p className="text-gray-300 text-sm">Starts in 2 days</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white font-medium">Speed Coding Challenge</p>
                  <p className="text-gray-300 text-sm">Starts in 5 days</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'battle':
        return (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4">Start a Battle</h3>
              <div className="flex space-x-4">
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                  <PlayCircle className="h-6 w-6" />
                  <span>Solo Battle</span>
                </button>
                <Link to="/lobby" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transform hover:scale-105 transition-transform duration-300">
                  <Swords className="h-6 w-6" />
                  <span>Multiplayer</span>
                </Link>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Available Lobbies</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Beginner's Arena</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">8/10 players</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Join
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Data Structures Duel</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">4/10 players</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Join
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-medium">Dynamic Programming Dojo</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">6/10 players</span>
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Profile</h3>
            {profile ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{profile.fullName}</h4>
                    <p className="text-gray-300">{profile.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 text-sm">Student ID</p>
                    <p className="text-white font-medium">{profile.id}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-300 text-sm">Status</p>
                    <p className={`font-medium ${profile.active ? 'text-green-400' : 'text-red-400'}`}>
                      {profile.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            ) : (
              <p className="text-gray-300">Loading profile...</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Professional Top Navigation */}
      <nav className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Algorithm Arena</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Student Dashboard</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 font-medium transition-all duration-200 ${
                      activeTab === item.id
                        ? 'text-white border-b-2 border-green-400'
                        : 'text-gray-300 hover:text-white border-b-2 border-transparent hover:border-green-300/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline text-sm">{item.label}</span>
                  </button>
                );
              })}
              
              {/* User Profile & Logout */}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-white">{profile?.fullName || 'Student'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200 border border-transparent hover:border-red-400/30"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8 relative z-10">
        {activeTab !== 'home' && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-300 mt-1">
              {activeTab === 'analytics' && 'Track your performance and progress'}
              {activeTab === 'battle' && 'Choose your battle mode and start coding'}
              {activeTab === 'contests' && 'Join competitions and challenge yourself'}
              {activeTab === 'friends' && 'Connect with other coders'}
              {activeTab === 'profile' && 'Manage your account settings'}
            </p>
          </div>
        )}

        {renderContent()}
      </div>
      

    </div>
  );


}
