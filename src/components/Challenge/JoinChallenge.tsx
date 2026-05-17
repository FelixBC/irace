import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChallengeService } from '../../services/challengeService';
import { Challenge } from '../../types';
import { CHALLENGE_DATA_CONSENT_VERSION } from '../../config/consent';
import { createLogger } from '../../lib/logger';
import { getStravaAuthUrl } from '../../services/stravaService';

const log = createLogger('joinChallenge');

const JoinChallenge: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, isConnectedToStrava } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [peerSharingConsent, setPeerSharingConsent] = useState(false);

  const loadChallenge = useCallback(async () => {
    if (!inviteCode) return;
    try {
      setIsLoading(true);
      const challengeData = await ChallengeService.getChallenge(inviteCode);
      setChallenge(challengeData);
      if (!challengeData) {
        setError('Challenge not found or expired');
      } else {
        setError(null);
      }
    } catch (err) {
      log.error('load challenge failed', err);
      setError('Challenge not found or expired');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;
    if (!peerSharingConsent) return;

    try {
      setIsJoining(true);
      setError(null);

      await ChallengeService.joinChallenge(challenge.id, {
        challengeDataConsentAccepted: peerSharingConsent,
        challengeDataConsentVersion: CHALLENGE_DATA_CONSENT_VERSION,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate(`/race/${challenge.inviteCode}`);
      }, 2000);
    } catch (err) {
      log.error('join failed', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const isAlreadyJoined =
    !!user &&
    !!challenge &&
    Array.isArray(challenge.participants) &&
    challenge.participants.some((p) => p.user?.id === user.id);

  const handleJoinWithStrava = () => {
    if (!peerSharingConsent) return;
    const returnPath = inviteCode ? `/join/${inviteCode}` : undefined;
    window.location.href = getStravaAuthUrl(returnPath);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Successfully Joined!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You're now part of the challenge. Redirecting to race view...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'Challenge not found or expired'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const sportConfig = {
    RUNNING: { icon: '🏃', name: 'Running', color: 'text-orange-600' },
    CYCLING: { icon: '🚴', name: 'Cycling', color: 'text-blue-600' },
    SWIMMING: { icon: '🏊', name: 'Swimming', color: 'text-teal-600' },
    WALKING: { icon: '🚶', name: 'Walking', color: 'text-green-600' },
    HIKING: { icon: '🥾', name: 'Hiking', color: 'text-amber-600' },
    WEIGHT_TRAINING: { icon: '💪', name: 'Weight Training', color: 'text-purple-600' },
    YOGA: { icon: '🧘', name: 'Yoga', color: 'text-indigo-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header — iRace brand blue gradient, not Strava orange */}
          <div className="bg-gradient-to-r from-brand-dark to-brand px-8 py-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{challenge.name}</h1>
            <p className="text-blue-100 text-lg">{challenge.description}</p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-blue-100">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>
                  {Array.isArray(challenge.participants)
                    ? challenge.participants.length
                    : challenge.participants ?? 0}{' '}
                  participants
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{challenge.duration}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Sports */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sports</h3>
              <div className="flex flex-wrap gap-3">
                {challenge.sports.map((sport, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg"
                  >
                    <span className="text-xl" aria-hidden="true">{sportConfig[sport]?.icon}</span>
                    <span className={`font-medium ${sportConfig[sport]?.color}`}>
                      {sportConfig[sport]?.name}
                    </span>
                    {challenge.sportGoals && challenge.sportGoals[sport] && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({challenge.sportGoals[sport]}{challenge.goalUnit})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Challenge Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Challenge Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Target className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Goal</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {challenge.goal} {challenge.goalUnit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Trophy className="w-5 h-5 text-brand" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{challenge.challengeType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Section — consent text is legally load-bearing, do not edit copy */}
            <div>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-600 text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                  Join This Challenge
                </h3>
                {/* Consent text — do not modify without legal review */}
                <p className="text-gray-700 dark:text-gray-200 mb-4 text-sm leading-relaxed">
                  iRace is a <strong>community challenge</strong> app: other people in this invite-only
                  challenge can see <strong>aggregated progress</strong> (e.g. distances toward the challenge goal)
                  and the display name/avatar you use here — not your full private Strava feed. We only use Strava
                  data as needed to run this challenge.
                </p>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-gray-500 dark:bg-gray-900"
                    checked={peerSharingConsent}
                    onChange={(e) => setPeerSharingConsent(e.target.checked)}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    I agree that my challenge stats may be shown to other participants in this challenge, as
                    described in the{' '}
                    <a href="/privacy" className="text-brand dark:text-brand-light underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                <div className="text-center space-y-3">
                  {user && isConnectedToStrava ? (
                    <button
                      type="button"
                      onClick={() => void handleJoinChallenge()}
                      disabled={isJoining || !peerSharingConsent || !!isAlreadyJoined}
                      className="bg-brand hover:bg-brand-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                    >
                      {isJoining ? 'Joining...' : isAlreadyJoined ? 'Already in this challenge' : 'Join challenge'}
                    </button>
                  ) : (
                    /* Official Strava button for connecting — R4 compliant */
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleJoinWithStrava}
                        disabled={isJoining || !peerSharingConsent}
                        className="disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2 rounded-md"
                        aria-label="Connect with Strava and join this challenge"
                      >
                        <img
                          src="/strava/btn_strava_connect_with_orange.svg"
                          alt="Connect with Strava"
                          className="h-12 w-auto"
                        />
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">& join this challenge</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trademark disclosure */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Strava® is a registered trademark of Strava, Inc. This app uses the Strava API but is not affiliated with or endorsed by Strava.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinChallenge;
