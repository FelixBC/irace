import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Trophy,
  Activity,
  Settings,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Edit3,
  Camera,
  Bell,
  Shield,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sport } from '../../types';
import { getStravaAuthUrl } from '../../services/stravaService';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}h`;
  }
  return `${minutes}m`;
}

const Profile: React.FC = () => {
  const { user, logout, isConnectedToStrava, disconnectStrava } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [stravaActionError, setStravaActionError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Real data will be loaded from database and Strava
  const [stats, setStats] = useState({
    totalChallenges: 0,
    completedChallenges: 0,
    currentChallenges: 0,
    totalDistance: 0,
    totalActivities: 0,
    longestStreak: 0,
    achievements: 0,
    rank: 'Bronze'
  });

  const [recentChallenges, setRecentChallenges] = useState<Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    sport: Sport;
  }>>([]);

  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    sport: Sport;
    distance: number;
    date: string;
    unit: string;
  }>>([]);

  const sportConfig = {
    RUNNING: { icon: '🏃‍♂️', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50' },
    CYCLING: { icon: '🚴‍♂️', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50' },
    SWIMMING: { icon: '🏊‍♂️', color: 'from-teal-400 to-cyan-600', bgColor: 'bg-teal-50' },
    WALKING: { icon: '🚶‍♂️', color: 'from-green-400 to-green-600', bgColor: 'bg-green-50' },
    HIKING: { icon: '🥾', color: 'from-amber-400 to-amber-600', bgColor: 'bg-amber-50' },
    WEIGHT_TRAINING: { icon: '💪', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50' },
    YOGA: { icon: '🧘‍♀️', color: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-50' },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative"
              >
                <img
                  src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=120&background=random`}
                  alt={user.name || 'User'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.name || 'Strava User'}
                  </h1>
                  <p className="text-gray-600 mb-4">{user.email}</p>
                  
                  {/* Strava Connection Status */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${isConnectedToStrava ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isConnectedToStrava ? 'Connected to Strava' : 'Not connected to Strava'}
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Member since January 2025</span>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Challenges</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.totalChallenges}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.totalDistance.toFixed(1)} km</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activities</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rank</p>
                                  <p className="text-2xl font-bold text-gray-900">{stats.rank}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'challenges', label: 'Challenges', icon: Trophy },
                { id: 'activities', label: 'Activities', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Recent Challenges */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Challenges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentChallenges.slice(0, 4).map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{sportConfig[challenge.sport]?.icon}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                            {getStatusText(challenge.status)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{challenge.name}</h4>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${challenge.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{challenge.progress}% complete</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-2xl">{sportConfig[activity.sport]?.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {activity.sport === Sport.WEIGHT_TRAINING 
                              ? (activity.calories ? `${activity.calories} calories ${activity.sport.toLowerCase()}` : `${activity.sport.toLowerCase()}`)
                              : `${activity.distance.toFixed(1)} ${activity.unit || 'km'} ${activity.sport.toLowerCase()}`
                            }
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            {activity.heartRate && (
                              <span className="flex items-center">
                                ❤️ {activity.heartRate.average}-{activity.heartRate.max} bpm
                              </span>
                            )}
                            {activity.sport === Sport.WEIGHT_TRAINING && activity.calories && (
                              <span className="flex items-center">
                                🔥 {activity.calories} cal
                              </span>
                            )}
                            {activity.elevation && (
                              <span className="flex items-center">
                                📈 +{activity.elevation.gain.toFixed(0)}m
                              </span>
                            )}
                            <span>{formatDistanceToNow(activity.date, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'challenges' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">All Challenges</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    onClick={() => window.location.href = '/create'}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Create New</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl">{sportConfig[challenge.sport]?.icon}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(challenge.status)}`}>
                          {getStatusText(challenge.status)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-3">{challenge.name}</h4>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div 
                          className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">{challenge.progress}% complete</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'activities' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
                
                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">This Week</h4>
                    <p className="text-2xl font-bold text-orange-600">47.2 km</p>
                    <p className="text-sm text-gray-600">+12% from last week</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">This Month</h4>
                    <p className="text-2xl font-bold text-blue-600">189.5 km</p>
                    <p className="text-sm text-gray-600">+8% from last month</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Longest Streak</h4>
                    <p className="text-2xl font-bold text-green-600">{stats.longestStreak} days</p>
                    <p className="text-sm text-gray-600">Current: 5 days</p>
                  </div>
                </div>

                {/* Activity List */}
                <div className="bg-gray-50 rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Recent Activities</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {recentActivities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{sportConfig[activity.sport]?.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {activity.distance.toFixed(1)} {activity.unit} {activity.sport.toLowerCase()}
                            </p>
                            <p className="text-sm text-gray-600">{activity.date}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                
                <div className="space-y-4">
                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Get notified about challenge updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  {/* Privacy */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Profile Privacy</p>
                        <p className="text-sm text-gray-600">Control who can see your profile</p>
                      </div>
                    </div>
                    <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>Public</option>
                      <option>Friends Only</option>
                      <option>Private</option>
                    </select>
                  </div>

                  {/* Strava Connection */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <ExternalLink className="w-5 h-5 text-gray-600 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Strava Connection</p>
                          <p className="text-sm text-gray-600">
                            {isConnectedToStrava ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {isConnectedToStrava ? (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            disabled={isDisconnecting}
                            onClick={async () => {
                              setStravaActionError(null);
                              setIsDisconnecting(true);
                              try {
                                await disconnectStrava();
                              } catch {
                                setStravaActionError('Disconnect failed. You can also remove the app in Strava settings.');
                              } finally {
                                setIsDisconnecting(false);
                              }
                            }}
                            className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                          >
                            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          onClick={() => {
                            setStravaActionError(null);
                            window.location.href = getStravaAuthUrl('/profile');
                          }}
                          className="px-4 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                        >
                          Connect Strava
                        </motion.button>
                      )}
                    </div>
                    {isConnectedToStrava && (
                      <p className="text-xs text-gray-500">
                        Manage or revoke access in{' '}
                        <a
                          href="https://www.strava.com/settings/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 underline"
                        >
                          Strava → Settings → My Apps
                        </a>
                        .
                      </p>
                    )}
                    {stravaActionError && (
                      <p className="text-sm text-red-600">{stravaActionError}</p>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Logout</p>
                        <p className="text-sm text-red-600">Sign out of your account</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      onClick={handleLogout}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Logout
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
