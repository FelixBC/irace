import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Clock, 
  Target,
  MoreVertical,
  Edit3,
  Trash2,
  Share2,
  Eye,
  TrendingUp,
  Award,
  MapPin,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sport, ChallengeStatus, ChallengeType } from '../../types';
import { ChallengeService } from '../../services/challengeService';
import { getMainAppUrl } from '../../config/urls';

interface Challenge {
  id: string;
  name: string;
  description: string;
  sports: Sport[];
  challengeType: ChallengeType;
  goal: number;
  goalUnit: string;
  sportGoals: Record<Sport, number>;
  duration: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  inviteCode: string;
  maxParticipants: number;
  status: ChallengeStatus;
  creatorId: string;
  participants: number;
  progress: number;
  isCreator: boolean;
}

const MyChallenges: React.FC = () => {
  const { user, isConnectedToStrava } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load challenges from database
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setIsLoading(true);
        const dbChallenges = await ChallengeService.getUserChallenges(user!.id);
        
        // Transform database challenges to match our interface
        const transformedChallenges: Challenge[] = dbChallenges.map(dbChallenge => ({
          id: dbChallenge.id,
          name: dbChallenge.name,
          description: dbChallenge.description || '',
          sports: dbChallenge.sports,
          challengeType: dbChallenge.challengeType,
          goal: dbChallenge.goal,
          goalUnit: dbChallenge.goalUnit,
          sportGoals: dbChallenge.sportGoals || {},
          duration: dbChallenge.duration,
          startDate: new Date(dbChallenge.startDate),
          endDate: new Date(dbChallenge.endDate),
          isPublic: dbChallenge.isPublic,
          inviteCode: dbChallenge.inviteCode,
          maxParticipants: dbChallenge.maxParticipants,
          status: dbChallenge.status,
          creatorId: dbChallenge.creatorId,
          participants: dbChallenge.participants?.length || 0,
          progress: 0, // TODO: Calculate real progress
          isCreator: dbChallenge.isCreator || false,
        }));
        
        setChallenges(transformedChallenges);
      } catch (error) {
        console.error('Error loading challenges:', error);
        // Fallback to empty array
        setChallenges([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadChallenges();
    }
  }, [user]);

  // No more mock data - everything comes from database

  // Use the challenges state from useEffect
  const displayChallenges = challenges;

  const sportConfig = {
    RUNNING: { icon: '🏃‍♂️', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50' },
    CYCLING: { icon: '🚴‍♂️', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50' },
    SWIMMING: { icon: '🏊‍♂️', color: 'from-teal-400 to-cyan-600', bgColor: 'bg-teal-50' },
    WALKING: { icon: '🚶‍♂️', color: 'from-green-400 to-green-600', bgColor: 'bg-green-50' },
    HIKING: { icon: '🥾', color: 'from-amber-400 to-amber-600', bgColor: 'bg-amber-50' },
    WEIGHT_TRAINING: { icon: '💪', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50' },
    YOGA: { icon: '🧘‍♀️', color: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-50' },
  };

  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.ACTIVE: return 'text-green-600 bg-green-100';
      case ChallengeStatus.COMPLETED: return 'text-blue-600 bg-blue-100';
      case ChallengeStatus.UPCOMING: return 'text-orange-600 bg-orange-100';
      case ChallengeStatus.PAUSED: return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.ACTIVE: return 'Active';
      case ChallengeStatus.COMPLETED: return 'Completed';
      case ChallengeStatus.UPCOMING: return 'Upcoming';
      case ChallengeStatus.PAUSED: return 'Paused';
      default: return 'Unknown';
    }
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredChallenges = displayChallenges.filter(challenge => {
    const matchesSearch = challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;
    const matchesSport = sportFilter === 'all' || challenge.sports.includes(sportFilter as Sport);
    const matchesOwnership = ownershipFilter === 'all' || 
                           (ownershipFilter === 'created' && challenge.isCreator) ||
                           (ownershipFilter === 'joined' && !challenge.isCreator);
    
    return matchesSearch && matchesStatus && matchesSport && matchesOwnership;
  });

  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return b.progress - a.progress;
      case 'participants':
        return b.participants - a.participants;
      default:
        return 0;
    }
  });

  const handleCreateChallenge = () => {
    window.location.href = '/create';
  };

  const handleViewChallenge = (challenge: Challenge) => {
    window.location.href = `/race/${challenge.inviteCode}`;
  };

  const handleEditChallenge = (challengeId: string) => {
    // In real app, this would open edit modal or navigate to edit page
    console.log('Edit challenge:', challengeId);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    // In real app, this would show confirmation dialog
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
  };

  const handleShareChallenge = (inviteCode: string) => {
          const shareUrl = `${getMainAppUrl()}/join/${inviteCode}`;
    navigator.clipboard.writeText(shareUrl);
    // In real app, show toast notification
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Challenges</h1>
              <p className="text-gray-600">Manage and track all your fitness challenges</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handleCreateChallenge}
              className="mt-4 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Challenge</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{challenges.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {challenges.filter(c => c.status === ChallengeStatus.ACTIVE).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {challenges.filter(c => c.status === ChallengeStatus.COMPLETED).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-purple-600">
                  {challenges.reduce((sum, c) => sum + c.participants, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={ChallengeStatus.ACTIVE}>Active</option>
                <option value={ChallengeStatus.COMPLETED}>Completed</option>
                <option value={ChallengeStatus.UPCOMING}>Upcoming</option>
                <option value={ChallengeStatus.PAUSED}>Paused</option>
              </select>

              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Sports</option>
                <option value={Sport.RUNNING}>Running</option>
                <option value={Sport.CYCLING}>Cycling</option>
                <option value={Sport.SWIMMING}>Swimming</option>
                <option value={Sport.WALKING}>Walking</option>
                <option value={Sport.HIKING}>Hiking</option>
                <option value={Sport.WEIGHT_TRAINING}>Strength Training</option>
                <option value={Sport.YOGA}>Yoga</option>
              </select>

              <select
                value={ownershipFilter}
                onChange={(e) => setOwnershipFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Challenges</option>
                <option value="created">Created by Me</option>
                <option value="joined">Joined</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name A-Z</option>
                <option value="progress">Progress</option>
                <option value="participants">Most Participants</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-1">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="w-5 h-5 flex flex-col space-y-1">
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                  <div className="w-full h-1 bg-current rounded-sm"></div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Challenges Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {sortedChallenges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || sportFilter !== 'all' || ownershipFilter !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first challenge!'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && sportFilter === 'all' && ownershipFilter === 'all' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateChallenge}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Your First Challenge
                </motion.button>
              )}
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your challenges...</p>
                  </div>
                </div>
              ) : challenges.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <Trophy className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges yet</h3>
                    <p className="text-gray-600 mb-6">Create your first fitness challenge to get started!</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCreateChallenge}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Challenge</span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {sortedChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Challenge Header */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                            {getStatusText(challenge.status)}
                          </span>
                          {challenge.isCreator ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Created
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              Joined
                            </span>
                          )}
                          {challenge.isPublic ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Private
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{challenge.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Sports Icons */}
                    <div className="flex items-center space-x-2 mb-4">
                      {challenge.sports.map((sport) => (
                        <span key={sport} className="text-2xl">
                          {sportConfig[sport]?.icon}
                        </span>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{challenge.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(challenge.progress)}`}
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Challenge Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {challenge.goal} {challenge.goalUnit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{challenge.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {challenge.participants}/{challenge.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {challenge.status === ChallengeStatus.UPCOMING 
                            ? `${getDaysRemaining(challenge.endDate)} days left`
                            : challenge.status === ChallengeStatus.ACTIVE
                            ? `${getDaysRemaining(challenge.endDate)} days remaining`
                            : 'Completed'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewChallenge(challenge)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShareChallenge(challenge.inviteCode)}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                      
                      {challenge.creatorId === user?.id && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditChallenge(challenge.id)}
                            className="px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="px-3 py-2 text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyChallenges;
