import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, QrCode, RefreshCw, Users, Clock, AlertCircle, Trophy } from 'lucide-react';
import { useParams } from 'react-router-dom';
import RaceTrack from './RaceTrack';
import ActivityFeed from './ActivityFeed';
import Leaderboard from './Leaderboard';
import TauntsPanel from './TauntsPanel';
import { Challenge, RaceTrack as RaceTrackType, Sport, ParticipantProgress, User, Activity, ChallengeType, ChallengeStatus, ChallengeParticipant } from '../../types';
// Mock data removed - using real data only
import { ChallengeService } from '../../services/challengeService';
import { createStravaDataService, RealTimeStravaData } from '../../services/stravaDataService';
import { useAuth } from '../../context/AuthContext';
import { differenceInDays, differenceInHours, differenceInMinutes, format } from 'date-fns';
import { getMainAppUrl } from '../../config/urls';

const DEMO_ROUTE_ID = 'demo-challenge';

function isDemoChallengeId(id: string | undefined): boolean {
  return id != null && id.toLowerCase() === DEMO_ROUTE_ID;
}

function demoAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=80&background=f97316&color=fff`;
}

/** Sample feed for /race/demo-challenge (sidebar looks empty without Strava). */
function getDemoActivityFeed(): { activities: Activity[]; users: User[] } {
  const now = Date.now();
  const users: User[] = [
    { id: 'demo-user-1', name: 'Alex', image: demoAvatar('Alex') },
    { id: 'demo-user-2', name: 'Jordan', image: demoAvatar('Jordan') },
    { id: 'demo-user-3', name: 'Sam', image: demoAvatar('Sam') },
  ];
  const activities: Activity[] = [
    {
      id: 'demo-act-1',
      stravaActivityId: '0',
      userId: 'demo-user-1',
      sport: Sport.RUNNING,
      distance: 8.2,
      duration: 2400,
      unit: 'km',
      date: new Date(now - 36 * 3600000),
      synced: false,
    },
    {
      id: 'demo-act-2',
      stravaActivityId: '0',
      userId: 'demo-user-2',
      sport: Sport.RUNNING,
      distance: 5.1,
      duration: 1800,
      unit: 'km',
      date: new Date(now - 50 * 3600000),
      synced: false,
    },
    {
      id: 'demo-act-3',
      stravaActivityId: '0',
      userId: 'demo-user-3',
      sport: Sport.CYCLING,
      distance: 22.4,
      duration: 3600,
      unit: 'km',
      date: new Date(now - 28 * 3600000),
      synced: false,
    },
    {
      id: 'demo-act-4',
      stravaActivityId: '0',
      userId: 'demo-user-1',
      sport: Sport.CYCLING,
      distance: 14.0,
      duration: 2700,
      unit: 'km',
      date: new Date(now - 60 * 3600000),
      synced: false,
    },
  ];
  return { activities, users };
}

function buildDemoChallenge(): Challenge {
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: DEMO_ROUTE_ID,
    name: 'Demo Challenge',
    description: 'A demo fitness challenge with running and cycling',
    sports: [Sport.RUNNING, Sport.CYCLING],
    challengeType: ChallengeType.DISTANCE,
    goal: 50,
    goalUnit: 'km',
    sportGoals: {
      [Sport.RUNNING]: 30,
      [Sport.CYCLING]: 20,
      [Sport.SWIMMING]: 0,
      [Sport.WALKING]: 0,
      [Sport.HIKING]: 0,
      [Sport.YOGA]: 0,
      [Sport.WEIGHT_TRAINING]: 0,
    },
    duration: '30 days',
    startDate: new Date(),
    endDate: end,
    isPublic: true,
    inviteCode: 'DEMO123',
    maxParticipants: 10,
    status: ChallengeStatus.ACTIVE,
    creatorId: 'demo-user',
  };
}

function buildDemoRaceTracks(ch: Challenge): RaceTrackType[] {
  const demoBySport: Partial<Record<Sport, { name: string; id: string; km: number }[]>> = {
    [Sport.RUNNING]: [
      { id: 'demo-user-1', name: 'Alex', km: 18 },
      { id: 'demo-user-2', name: 'Jordan', km: 12 },
      { id: 'demo-user-3', name: 'Sam', km: 22 },
    ],
    [Sport.CYCLING]: [
      { id: 'demo-user-1', name: 'Alex', km: 14 },
      { id: 'demo-user-2', name: 'Jordan', km: 9 },
      { id: 'demo-user-3', name: 'Sam', km: 17 },
    ],
  };

  return ch.sports.map((sport) => {
    const goalKm = ch.sportGoals?.[sport] || ch.goal || 1;
    const rows = demoBySport[sport] || [
      { id: 'demo-a', name: 'Runner A', km: 10 },
      { id: 'demo-b', name: 'Runner B', km: 6 },
      { id: 'demo-c', name: 'Runner C', km: 12 },
    ];
    const demoParticipants: ParticipantProgress[] = rows.map((row) => {
      const pct = Math.min(100, (row.km / goalKm) * 100);
      return {
        user: {
          id: row.id,
          name: row.name,
          image: demoAvatar(row.name),
        },
        distance: row.km,
        percentage: pct,
        dailyProgress: [],
      };
    });

    const leaderRow = demoParticipants.reduce(
      (best, cur) => (cur.distance > best.distance ? cur : best),
      demoParticipants[0]
    );

    return {
      sport,
      participants: demoParticipants,
      maxDistance: goalKm,
      leader: leaderRow?.user ?? null,
    };
  });
}

const RaceView: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user, stravaTokens, isConnectedToStrava } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [raceTracks, setRaceTracks] = useState<RaceTrackType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [stravaData, setStravaData] = useState<RealTimeStravaData | null>(null);
  const [isLoadingStrava, setIsLoadingStrava] = useState(false);
  const [stravaError, setStravaError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Demo: apply challenge + tracks before paint. Real routes: clear stale demo state here too (same frame).
  useLayoutEffect(() => {
    if (!challengeId) return;
    setStravaData(null);
    if (isDemoChallengeId(challengeId)) {
      const dc = buildDemoChallenge();
      setChallenge(dc);
      setRaceTracks(buildDemoRaceTracks(dc));
    } else {
      setChallenge(null);
      setRaceTracks([]);
    }
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId || isDemoChallengeId(challengeId)) return;
    const loadRealChallenge = async () => {
      try {
        const realChallenge = await ChallengeService.getChallenge(challengeId);
        if (realChallenge) {
          setChallenge(realChallenge);
        } else {
          console.error('Challenge not found:', challengeId);
          setChallenge(null);
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
        setChallenge(null);
      }
    };
    void loadRealChallenge();
  }, [challengeId]);

  // After real challenge loads (or Strava / user becomes available), sync tracks — avoids stale
  // `isConnectedToStrava` inside the async fetch callback so a just-created challenge shows data without refresh.
  useEffect(() => {
    if (!challengeId || isDemoChallengeId(challengeId) || !challenge) return;

    if (isConnectedToStrava && stravaTokens) {
      console.log('🔄 Loading Strava data for challenge', challenge.inviteCode);
      void loadStravaData();
    } else {
      console.log('🔗 No Strava session — empty tracks for challenge', challenge.inviteCode);
      generateEmptyRaceTracks(challenge);
    }
  }, [challengeId, challenge, isConnectedToStrava, stravaTokens, user?.id]);

  const loadStravaData = async () => {
    if (!stravaTokens) return;
    
    console.log('🔄 Starting to load Strava data...');
    console.log('🔑 Strava tokens:', stravaTokens);
    
    setIsLoadingStrava(true);
    setStravaError(null);
    
    try {
      const stravaService = createStravaDataService(stravaTokens);
      console.log('🏃‍♂️ Strava service created, fetching user data...');
      
      const data = await stravaService.refreshUserData();
      console.log('✅ Strava data received:', data);
      console.log('📊 Activities count:', data.activities.length);
      console.log('📊 Sample activities:', data.activities.slice(0, 3));
      
      setStravaData(data);
      
      // Update race tracks with real Strava data
      generateRaceTracksWithRealData(data.activities);
    } catch (error) {
      console.error('❌ Error loading Strava data:', error);
      setStravaError(error instanceof Error ? error.message : 'Failed to load Strava data');
    } finally {
      setIsLoadingStrava(false);
    }
  };

  const generateDemoRaceTracks = (source?: Challenge | null) => {
    const ch = source ?? challenge;
    if (!ch) return;
    setRaceTracks(buildDemoRaceTracks(ch));
  };

  const generateEmptyRaceTracks = (challenge: Challenge) => {
    if (!challenge) return;

    console.log('🏃‍♂️ Generating empty race tracks for challenge:', challenge);

    const tracks: RaceTrackType[] = challenge.sports.map((sport) => {
      // Create empty tracks with 0 progress
      const participantProgress: ParticipantProgress[] = [{
        user: user || { id: '1', name: 'You', image: 'https://ui-avatars.com/api/?name=You&size=40&background=random' },
        distance: 0,
        percentage: 0,
        dailyProgress: [],
      }];

      // Use sport-specific goal if available, otherwise fallback to challenge goal
      const sportGoal = challenge.sportGoals?.[sport] || challenge.goal || 100;

      return {
        sport,
        participants: participantProgress,
        maxDistance: sportGoal, // Use sport-specific goal
        leader: participantProgress[0].user,
      };
    });

    console.log('🏃‍♂️ Generated empty tracks:', tracks);
    setRaceTracks(tracks);
  };

  const generateRaceTracksWithRealData = (activities: Activity[]) => {
    if (!challenge || !user) return;

    console.log('🏃‍♂️ Generating real race tracks with Strava data:', activities);

    const tracks: RaceTrackType[] = challenge.sports.map((sport) => {
      // Get activities for this sport from real Strava data
      // BUT only include activities that happened AFTER the challenge start date
      const challengeStartDate = new Date(challenge.startDate);
      console.log(`📅 Challenge start date: ${challengeStartDate.toDateString()} (${challengeStartDate.toISOString()})`);
      
      const sportActivities = activities.filter(
        (activity) => 
          activity.sport === sport && 
          new Date(activity.date) >= challengeStartDate
      );

      console.log(`🏃‍♂️ Sport ${sport} has ${sportActivities.length} activities since challenge start (${challengeStartDate.toDateString()})`);
      
      // Log some sample activities to verify dates
      if (sportActivities.length > 0) {
        console.log(`📅 Sample activities for ${sport}:`, sportActivities.slice(0, 2).map(a => ({
          date: new Date(a.date).toDateString(),
          distance: a.distance,
          type: a.sport
        })));
      }

      // For real challenges, calculate progress based on challenge goal
      const totalDistance = sportActivities.reduce((sum, a) => sum + a.distance, 0);
      const challengeGoal = challenge.sportGoals?.[sport] || challenge.goal || 100; // Use sport-specific goal, fallback to general goal
      const progressPercentage = Math.min((totalDistance / challengeGoal) * 100, 100); // Cap at 100%
      
      console.log(`🏃‍♂️ Sport ${sport}: ${totalDistance}km / ${challengeGoal}km = ${progressPercentage.toFixed(1)}% (since challenge start)`);
      
      const participantProgress: ParticipantProgress[] = [{
        user: user,
        distance: totalDistance,
        percentage: progressPercentage,
        dailyProgress: [], // Simplified for demo
      }];

      // Sort by distance (descending)
      participantProgress.sort((a, b) => b.distance - a.distance);

      const leader = participantProgress.length > 0 ? participantProgress[0].user : null;

      return {
        sport,
        participants: participantProgress,
        maxDistance: challengeGoal, // Use the sport-specific goal as max distance
        leader,
      };
    });

    console.log('🏃‍♂️ Generated real tracks:', tracks);
    setRaceTracks(tracks);
  };

  const getTimeRemaining = (): string => {
    if (!challenge) return '0 days';

    const now = new Date();
    const end = challenge.endDate;

    if (end <= now) return '0m';

    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;
    const minutes = differenceInMinutes(end, now) % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const finishers = useMemo(() => {
    const list = Array.isArray((challenge as Challenge | null)?.participants)
      ? ((challenge as Challenge).participants as ChallengeParticipant[])
      : [];
    return [...list]
      .filter((p) => typeof p.finishPosition === 'number' && p.finishPosition != null)
      .sort((a, b) => (a.finishPosition ?? 0) - (b.finishPosition ?? 0));
  }, [challenge]);

  const hasResults = finishers.length > 0 || challenge?.status === ChallengeStatus.COMPLETED;

  const getTotalParticipants = (): number => {
    // For demo challenge, show the demo users count
    if (isDemoChallengeId(challengeId)) {
      return 3; // Demo has 3 participants
    }
    
    // For real challenges, count actual participants
    if (raceTracks.length === 0) return 0;
    
    // Get unique participants across all tracks
    const allParticipants = new Set<string>();
    raceTracks.forEach(track => {
      track.participants.forEach(participant => {
        allParticipants.add(participant.user.id);
      });
    });
    
    return allParticipants.size;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    if (isDemoChallengeId(challengeId)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      generateDemoRaceTracks(challenge);
    } else if (isConnectedToStrava && stravaTokens) {
      await loadStravaData();
    } else if (challenge) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      generateEmptyRaceTracks(challenge);
    }

    setIsRefreshing(false);
  };

  const copyShareLink = async () => {
    if (!challenge?.inviteCode) {
      console.error('No invite code available');
      return;
    }
    
    try {
      const shareUrl = `${getMainAppUrl()}/join/${challenge.inviteCode}`;
      await navigator.clipboard.writeText(shareUrl);
      console.log('Share link copied to clipboard:', shareUrl);
      
      // Show visual feedback
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      // Fallback: show the URL in an alert
      const shareUrl = `${getMainAppUrl()}/join/${challenge.inviteCode}`;
      alert(`Share this link: ${shareUrl}`);
    }
  };

  const isDemo = isDemoChallengeId(challengeId);
  const demoFeed = useMemo(() => (isDemo ? getDemoActivityFeed() : null), [isDemo]);
  const feedActivities = demoFeed?.activities ?? stravaData?.activities ?? [];
  const feedUsers =
    demoFeed?.users ?? (stravaData?.user ? [stravaData.user] : []);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-4"
            >
              {challenge.name}
              {isDemo && (
                <span className="block text-lg font-normal text-orange-200 mt-2">
                  🎮 Demo Challenge
                </span>
              )}
            </motion.h1>
            <div className="flex flex-wrap justify-center items-center gap-6 text-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>{getTotalParticipants()} participants</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{getTimeRemaining()} remaining</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <span>{format(challenge.startDate, 'MMM d')} - {format(challenge.endDate, 'MMM d')}</span>
              </div>
            </div>
          </div>

          {/* Challenge Mode Status */}
          {isDemo ? (
            <div className="flex justify-center mt-6">
              <div className="bg-orange-500/20 backdrop-blur rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2 text-orange-200">
                  <span>🎮</span>
                  <span>Demo Mode • Using sample data with multiple participants</span>
                </div>
              </div>
            </div>
          ) : (
            /* Strava Data Status for Real Challenges */
            isConnectedToStrava && (
              <div className="flex justify-center mt-6">
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  {isLoadingStrava ? (
                    <div className="flex items-center space-x-2 text-white">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading your Strava data...</span>
                    </div>
                  ) : stravaError ? (
                    <div className="flex items-center space-x-2 text-red-200">
                      <AlertCircle className="w-4 h-4" />
                      <span>Error: {stravaError}</span>
                    </div>
                  ) : stravaData ? (
                    <div className="flex items-center space-x-2 text-white">
                      <span>✅</span>
                      <span>Connected to Strava • Last sync: {format(stravaData.lastSync, 'MMM d, h:mm a')}</span>
                      <span className="text-xs text-white/80 ml-2">• Showing last 2 days</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-white">
                      <span>🔗</span>
                      <span>Connected to Strava</span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={copyShareLink}
              className={`flex items-center space-x-2 backdrop-blur px-4 py-2 rounded-lg transition-colors ${
                shareCopied 
                  ? 'bg-green-500/80 text-white' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {shareCopied ? (
                <>
                  <span className="w-4 h-4">✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </motion.button>
            {isConnectedToStrava && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={() => window.location.href = '/create'}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
              >
                <span>🏆</span>
                <span>Create Challenge</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Race Tracks */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {raceTracks.map((track) => (
                <motion.div
                  key={track.sport}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <RaceTrack track={track} timeRemaining={getTimeRemaining()} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {hasResults && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                  Results
                </h3>
                {challenge?.status === ChallengeStatus.COMPLETED && (
                  <p className="text-xs text-gray-500 mb-4">Challenge closed. Results are final.</p>
                )}
                {finishers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No one finished yet.</p>
                ) : (
                  <div className="space-y-2">
                    {finishers.slice(0, 10).map((p) => (
                      <div key={p.user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-8 text-sm font-mono text-gray-500">{p.finishPosition}.</div>
                        <img
                          src={
                            p.user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user.name || 'User')}&size=64&background=f97316&color=fff`
                          }
                          alt={p.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{p.user.name || 'User'}</div>
                          <div className="text-xs text-gray-400">
                            {typeof p.finalDistance === 'number'
                              ? `${p.finalDistance.toFixed(1)}km`
                              : typeof p.distance === 'number'
                                ? `${p.distance.toFixed(1)}km`
                                : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            <Leaderboard raceTracks={raceTracks} />
            {!isDemo && challengeId && <TauntsPanel inviteCode={challengeId} />}
            <ActivityFeed activities={feedActivities} users={feedUsers} />

            {/* Show message when no Strava data */}
            {isConnectedToStrava &&
              !stravaData &&
              !isLoadingStrava &&
              !isDemo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-500 mb-2">No Strava activities found</p>
                <p className="text-sm text-gray-400">Your recent activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceView;