import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChallengeService } from '../../services/challengeService';
import { Challenge, Sport, ChallengeType, ChallengeStatus } from '../../types';
import { getMainAppUrl } from '../../config/urls';
import { CHALLENGE_DATA_CONSENT_VERSION } from '../../config/consent';

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

  useEffect(() => {
    if (inviteCode) {
      loadChallenge();
    }
  }, [inviteCode]);


  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      const challengeData = await ChallengeService.getChallenge(inviteCode!);
      setChallenge(challengeData);
    } catch (err) {
      console.error('Error loading challenge:', err);
      setError('Challenge not found or expired');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!user || !challenge) return;

    try {
      setIsJoining(true);
      setError(null);

      // Join the challenge
      await ChallengeService.joinChallenge(challenge.id, user.id, {
        challengeDataConsentAccepted: true,
        challengeDataConsentVersion: CHALLENGE_DATA_CONSENT_VERSION,
      });
      
      setSuccess(true);
      
      // Redirect to the race view after 2 seconds
      setTimeout(() => {
        navigate(`/race/${challenge.inviteCode}`);
      }, 2000);

    } catch (err) {
      console.error('Error joining challenge:', err);
      setError('Failed to join challenge. Please try again.');
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
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    if (!clientId) {
      setError('App misconfiguration: VITE_STRAVA_CLIENT_ID is missing.');
      return;
    }
    const redirectUri = `${getMainAppUrl()}/api/auth/strava/callback`;
    const scope = 'read,activity:read_all';
    const state = encodeURIComponent(`/join/${inviteCode}`);

    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = stravaAuthUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Joined!</h1>
          <p className="text-gray-600 mb-6">You're now part of the challenge. Redirecting to race view...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  const sportConfig = {
    RUNNING: { icon: '🏃‍♂️', name: 'Running', color: 'text-orange-600' },
    CYCLING: { icon: '🚴‍♂️', name: 'Cycling', color: 'text-blue-600' },
    SWIMMING: { icon: '🏊‍♂️', name: 'Swimming', color: 'text-teal-600' },
    WALKING: { icon: '🚶‍♂️', name: 'Walking', color: 'text-green-600' },
    HIKING: { icon: '🥾', name: 'Hiking', color: 'text-brown-600' },
    WEIGHT_TRAINING: { icon: '💪', name: 'Weight Training', color: 'text-purple-600' },
    YOGA: { icon: '🧘‍♀️', name: 'Yoga', color: 'text-indigo-600' },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{challenge.name}</h1>
            <p className="text-orange-100 text-lg">{challenge.description}</p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-orange-100">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sports</h3>
              <div className="flex flex-wrap gap-3">
                {challenge.sports.map((sport, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <span className="text-xl">{sportConfig[sport]?.icon}</span>
                    <span className={`font-medium ${sportConfig[sport]?.color}`}>
                      {sportConfig[sport]?.name}
                    </span>
                    {challenge.sportGoals && challenge.sportGoals[sport] && (
                      <span className="text-sm text-gray-600">
                        ({challenge.sportGoals[sport]}{challenge.goalUnit})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Challenge Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Target className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Goal</p>
                    <p className="font-semibold text-gray-900">
                      {challenge.goal} {challenge.goalUnit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Trophy className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900">{challenge.challengeType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Section */}
            <div className="text-center">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              
              <div className="mb-6 p-6 bg-orange-50 rounded-lg border border-orange-200 text-left">
                <h3 className="text-lg font-semibold text-orange-900 mb-2 text-center">
                  Join This Challenge
                </h3>
                <p className="text-orange-800 mb-4 text-sm leading-relaxed">
                  StravaRacer is a <strong>community challenge</strong> app: other people in this invite-only
                  challenge can see <strong>aggregated progress</strong> (e.g. distances toward the challenge goal)
                  and the display name/avatar you use here — not your full private Strava feed. We only use Strava
                  data as needed to run this challenge.
                </p>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    checked={peerSharingConsent}
                    onChange={(e) => setPeerSharingConsent(e.target.checked)}
                  />
                  <span className="text-sm text-gray-800">
                    I agree that my challenge stats may be shown to other participants in this challenge, as
                    described in the{' '}
                    <a href="/privacy" className="text-orange-600 underline">
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
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
                    >
                      {isJoining ? 'Joining...' : isAlreadyJoined ? 'Already in this challenge' : 'Join challenge'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleJoinWithStrava}
                      disabled={isJoining || !peerSharingConsent}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto"
                    >
                      {isJoining ? 'Joining...' : 'Connect Strava & join'}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Strava® is a registered trademark. This app uses the Strava API but is not endorsed by Strava.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinChallenge;