import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
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
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Sport, ChallengeStatus, ChallengeType } from '../../types';
import { ChallengeService } from '../../services/challengeService';
import type { Challenge as ApiChallenge } from '../../types';
import { getMainAppUrl } from '../../config/urls';
import { getStravaAuthUrl } from '../../services/stravaService';
import { createLogger } from '../../lib/logger';
import { useToast } from '../../context/ToastContext';

const log = createLogger('myChallenges');

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

type StatusFilter = 'all' | ChallengeStatus;
type OwnershipFilter = 'all' | 'created' | 'joined';
type SportFilter = 'all' | Sport;
type SortBy = 'recent' | 'name' | 'progress' | 'participants';

const MyChallenges: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [openMenuChallengeId, setOpenMenuChallengeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load challenges from database
  useEffect(() => {
    const loadChallenges = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const dbChallenges = await ChallengeService.getUserChallenges(user.id);

        // Transform database challenges to match our interface
        const transformedChallenges: Challenge[] = (dbChallenges as ApiChallenge[]).map((dbChallenge) => ({
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
          participants:
            typeof dbChallenge.participants === 'number'
              ? dbChallenge.participants
              : Array.isArray(dbChallenge.participants)
                ? dbChallenge.participants.length
                : 0,
          progress: typeof dbChallenge.myProgress === 'number' ? dbChallenge.myProgress : 0,
          isCreator: dbChallenge.isCreator || false,
        }));
        
        setChallenges(transformedChallenges);
      } catch (error) {
        log.error('load challenges failed', error);
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

  useEffect(() => {
    if (openMenuChallengeId == null) return;
    const onDocClick = () => setOpenMenuChallengeId(null);
    const t = window.setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', onDocClick);
    };
  }, [openMenuChallengeId]);

  // No more mock data - everything comes from database

  // Use the challenges state from useEffect
  const displayChallenges = challenges;

  const sportConfig = {
    RUNNING: { icon: '🏃‍♂️', color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50 dark:bg-orange-950/40' },
    CYCLING: { icon: '🚴‍♂️', color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/40' },
    SWIMMING: { icon: '🏊‍♂️', color: 'from-teal-400 to-cyan-600', bgColor: 'bg-teal-50 dark:bg-teal-950/40' },
    WALKING: { icon: '🚶‍♂️', color: 'from-green-400 to-green-600', bgColor: 'bg-green-50 dark:bg-green-950/40' },
    HIKING: { icon: '🥾', color: 'from-amber-400 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
    WEIGHT_TRAINING: { icon: '💪', color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/40' },
    YOGA: { icon: '🧘‍♀️', color: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40' },
  };

  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.ACTIVE:
        return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/50';
      case ChallengeStatus.COMPLETED:
        return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/50';
      case ChallengeStatus.CANCELLED:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
      case ChallengeStatus.DRAFT:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.ACTIVE: return 'Active';
      case ChallengeStatus.COMPLETED: return 'Completed';
      case ChallengeStatus.CANCELLED: return 'Cancelled';
      case ChallengeStatus.DRAFT: return 'Draft';
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
    if (progress >= 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const filteredChallenges = displayChallenges.filter(challenge => {
    const matchesSearch = challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;
    const matchesSport = sportFilter === 'all' || challenge.sports.includes(sportFilter);
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

  const handleConnectStrava = () => {
    window.location.href = getStravaAuthUrl('/my-challenges');
  };

  const handleViewChallenge = (challenge: Challenge) => {
    window.location.href = `/race/${challenge.inviteCode}`;
  };

  const handleEditChallenge = () => {
    showToast('info', 'Coming soon', 'Editing challenges is not available yet.');
  };

  const confirmAndDeleteChallenge = async (challenge: Challenge) => {
    if (!challenge.isCreator) return;
    setOpenMenuChallengeId(null);
    if (
      !window.confirm(
        'Permanently delete this challenge? All participant rows and taunts for this challenge will be removed. Synced Strava activities stay on your account but are unlinked from this challenge.'
      )
    ) {
      return;
    }
    try {
      await ChallengeService.deleteChallenge(challenge.id);
      setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      showToast('success', 'Challenge deleted');
    } catch (error) {
      log.error('delete challenge failed', error);
      showToast(
        'error',
        'Could not delete',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const handleShareChallenge = async (inviteCode: string) => {
    const shareUrl = `${getMainAppUrl()}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('success', 'Link copied', 'Share link is on your clipboard.');
    } catch (clipboardError) {
      log.warn('copy invite link failed', clipboardError);
      showToast('error', 'Copy failed', 'Could not copy the link. Please copy it manually.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-transparent px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-brand-faint dark:bg-brand/20 text-brand dark:text-brand-light flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Challenges</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to log in and connect Strava before we can show your challenges.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnectStrava}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Connect Strava
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">My Challenges</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and track all your fitness challenges</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handleCreateChallenge}
              className="mt-4 sm:mt-0 bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
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
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{challenges.length}</p>
              </div>
              <div className="w-12 h-12 bg-brand-faint dark:bg-brand/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-brand dark:text-brand-light" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {challenges.filter(c => c.status === ChallengeStatus.ACTIVE).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {challenges.filter(c => c.status === ChallengeStatus.COMPLETED).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Participants</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {challenges.reduce((sum, c) => sum + c.participants, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
              >
                <option value="all">All Status</option>
                <option value={ChallengeStatus.ACTIVE}>Active</option>
                <option value={ChallengeStatus.COMPLETED}>Completed</option>
                <option value={ChallengeStatus.CANCELLED}>Cancelled</option>
                <option value={ChallengeStatus.DRAFT}>Draft</option>
              </select>

              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value as SportFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
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
                onChange={(e) => setOwnershipFilter(e.target.value as OwnershipFilter)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
              >
                <option value="all">All Challenges</option>
                <option value="created">Created by Me</option>
                <option value="joined">Joined</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:[color-scheme:dark]"
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
                    ? 'bg-brand-faint text-brand dark:bg-brand/20 dark:text-brand-light'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
                    ? 'bg-brand-faint text-brand dark:bg-brand/20 dark:text-brand-light'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading your challenges...</p>
              </div>
            </div>
          ) : sortedChallenges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {challenges.length === 0 ? 'No challenges yet' : 'No challenges found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {challenges.length === 0
                  ? 'Get started by creating your first challenge!'
                  : 'Try adjusting your filters or search terms'}
              </p>
              {challenges.length === 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateChallenge}
                  className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Challenge</span>
                </motion.button>
              )}
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                  {sortedChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleViewChallenge(challenge)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewChallenge(challenge);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  } cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-950`}
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
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-faint text-brand dark:bg-brand/20 dark:text-brand-light flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Created
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              Joined
                            </span>
                          )}
                          {challenge.isPublic ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              Public
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Private
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{challenge.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{challenge.description}</p>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="relative z-20">
                        <motion.button
                          type="button"
                          aria-expanded={openMenuChallengeId === challenge.id}
                          aria-haspopup="true"
                          aria-label="Challenge actions"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuChallengeId((cur) =>
                              cur === challenge.id ? null : challenge.id
                            );
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </motion.button>
                        {openMenuChallengeId === challenge.id && (
                          <div
                            role="menu"
                            className="absolute right-0 mt-1 z-30 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuChallengeId(null);
                                handleViewChallenge(challenge);
                              }}
                            >
                              <Eye className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                              View race
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuChallengeId(null);
                                void handleShareChallenge(challenge.inviteCode);
                              }}
                            >
                              <Share2 className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                              Copy invite link
                            </button>
                            {challenge.isCreator && (
                              <>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuChallengeId(null);
                                    handleEditChallenge();
                                  }}
                                >
                                  <Edit3 className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                                  Edit…
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void confirmAndDeleteChallenge(challenge);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
                                  Delete challenge
                                </button>
                              </>
                            )}
                          </div>
                        )}
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
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">{challenge.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(challenge.progress)}`}
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Challenge Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {challenge.goal} {challenge.goalUnit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{challenge.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {challenge.participants}/{challenge.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {challenge.status === ChallengeStatus.ACTIVE
                            ? `${getDaysRemaining(challenge.endDate)} days remaining`
                            : challenge.status === ChallengeStatus.COMPLETED
                              ? 'Completed'
                              : getStatusText(challenge.status)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewChallenge(challenge);
                        }}
                        className="flex-1 bg-brand hover:bg-brand-hover text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareChallenge(challenge.inviteCode);
                        }}
                        className="px-3 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                      
                      {challenge.isCreator && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChallenge();
                            }}
                            className="px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 dark:hover:text-blue-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              void confirmAndDeleteChallenge(challenge);
                            }}
                            className="px-3 py-2 text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60 dark:hover:text-red-300"
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyChallenges;
