import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, QrCode, Share2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sport, Challenge } from '../../types';
import { ChallengeService, CreateChallengeData } from '../../services/challengeService';
import QRCode from 'react-qr-code';
import GoalSettingModal from './GoalSettingModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getMainAppUrl } from '../../config/urls';
import { createLogger } from '../../lib/logger';

const log = createLogger('createChallenge');

const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    sports: [] as Sport[],
    duration: 7,
    isPrivate: false,
    goals: {} as Record<Sport, number>,
    creatorParticipantSharingAck: false,
  });
  const [createdChallenge, setCreatedChallenge] = useState<Challenge | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sportOptions = [
    { id: Sport.RUNNING, name: 'Running', icon: '🏃‍♂️', color: 'from-orange-400 to-red-500' },
    { id: Sport.CYCLING, name: 'Cycling', icon: '🚴‍♂️', color: 'from-blue-400 to-blue-600' },
    { id: Sport.SWIMMING, name: 'Swimming', icon: '🏊‍♂️', color: 'from-teal-400 to-cyan-600' },
    { id: Sport.WALKING, name: 'Walking', icon: '🚶‍♂️', color: 'from-green-400 to-green-600' },
    { id: Sport.HIKING, name: 'Hiking', icon: '🥾', color: 'from-amber-400 to-amber-600' },
    { id: Sport.WEIGHT_TRAINING, name: 'Strength Training', icon: '💪', color: 'from-purple-400 to-purple-600' },
  ];

  const durationOptions = [
    { value: 3, label: '3 days', description: 'Quick sprint' },
    { value: 7, label: '1 week', description: 'Standard challenge' },
    { value: 14, label: '2 weeks', description: 'Extended challenge' },
    { value: 30, label: '1 month', description: 'Endurance challenge' },
  ];

  const handleSportToggle = (sport: Sport) => {
    if (formData.sports.includes(sport)) {
      // Remove sport and its goal
      setFormData(prev => ({
        ...prev,
        sports: prev.sports.filter(s => s !== sport),
        goals: Object.fromEntries(
          Object.entries(prev.goals).filter(([s]) => s !== sport)
        ) as Record<Sport, number>,
      }));
    } else {
      // Add sport and open goal modal
      setSelectedSport(sport);
      setShowGoalModal(true);
    }
  };

  const handleNext = () => {
    if (step === 1 && formData.name.trim() && formData.sports.length > 0) {
      setStep(2);
    }
  };

  const handleGoalsSet = (goals: Record<Sport, number>) => {
    setFormData(prev => ({
      ...prev,
      goals: { ...prev.goals, ...goals },
      sports: [...prev.sports, selectedSport!],
    }));
    setShowGoalModal(false);
    setSelectedSport(null);
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      showToast('error', 'Authentication Required', 'Please log in to create a challenge');
      return;
    }

    // Validate that all selected sports have goals
    const missingGoals = formData.sports.filter(sport => !formData.goals[sport]);
    if (missingGoals.length > 0) {
      showToast('error', 'Missing Goals', 'Please set goals for all selected sports');
      return;
    }

    if (!formData.creatorParticipantSharingAck) {
      showToast(
        'error',
        'Acknowledgement required',
        'Please confirm how participant progress is shown in this challenge.'
      );
      return;
    }

    setIsCreating(true);

    const challengeData: CreateChallengeData = {
      name: formData.name,
      sports: formData.sports,
      duration: formData.duration,
      isPrivate: formData.isPrivate,
      goals: formData.goals,
      creatorParticipantSharingAck: formData.creatorParticipantSharingAck,
    };

    try {
      const newChallenge = await ChallengeService.createChallenge(challengeData);
      setCreatedChallenge(newChallenge);
      showToast('success', 'Challenge Created!', 'Your fitness challenge is ready to share');
      setStep(3);
    } catch (error) {
      log.error('create failed', error);
      showToast('error', 'Creation Failed', error instanceof Error ? error.message : 'Failed to create challenge. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = async () => {
    if (createdChallenge) {
      const shareUrl = `${getMainAppUrl()}/join/${createdChallenge.inviteCode}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('success', 'Link Copied!', 'Share link copied to clipboard');
      } catch (e) {
        log.error('clipboard write failed', e);
        showToast('error', 'Copy failed', 'Could not copy the link. Please copy it manually.');
      }
    }
  };

  const goToRace = () => {
    if (createdChallenge) {
      navigate(`/race/${createdChallenge.inviteCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step > stepNumber ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Step {step} of 3: {
                step === 1 ? 'Challenge Details' :
                step === 2 ? 'Settings' : 'Share & Launch'
              }
            </p>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Challenge</h2>
              
              {/* Challenge Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Winter Fitness Challenge 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.name.length}/50 characters
                </p>
              </div>

              {/* Sport Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Sports
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {sportOptions.map((sport) => (
                    <motion.button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.sports.includes(sport.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{sport.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{sport.name}</p>
                          {formData.goals[sport.id] && (
                            <p className="text-sm text-orange-600">
                              Goal: {formData.goals[sport.id]} {sport.id === Sport.WEIGHT_TRAINING ? 'sessions' : 'km'}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                {formData.sports.length === 0 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Select at least one sport for your challenge
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={handleNext}
                disabled={!formData.name.trim() || formData.sports.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Challenge Settings</h2>
              
              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Challenge Duration
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {durationOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, duration: option.value }))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.duration === option.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Privacy Settings
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!formData.isPrivate}
                      onChange={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Public Challenge</p>
                      <p className="text-sm text-gray-600">Anyone can join with the link</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.isPrivate}
                      onChange={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Private Challenge</p>
                      <p className="text-sm text-gray-600">Invite-only challenge</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Goals Validation Message */}
              {(() => {
                const missingGoals = formData.sports.filter(sport => !formData.goals[sport]);
                if (missingGoals.length > 0) {
                  return (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            Goals Required
                          </p>
                          <p className="text-sm text-amber-700">
                            Please set goals for: {missingGoals.map(sport => {
                              const sportOption = sportOptions.find(s => s.id === sport);
                              return sportOption?.name || sport;
                            }).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    checked={formData.creatorParticipantSharingAck}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, creatorParticipantSharingAck: e.target.checked }))
                    }
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I understand that people who join this challenge (via my invite link) will see each
                    other&apos;s <strong>challenge progress</strong> here — aggregated stats for this challenge
                    only, not their full Strava profiles. See the{' '}
                    <a href="/privacy" className="text-orange-600 underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onClick={handleCreateChallenge}
                  disabled={isCreating || !formData.creatorParticipantSharingAck}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Challenge</span>
                      <Plus className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {step === 3 && createdChallenge && (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge Created!</h2>
                <p className="text-gray-600">Your fitness challenge is ready to share</p>
              </div>

              {/* Challenge Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">{createdChallenge.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Sports</p>
                    <p className="font-medium">{createdChallenge.sports?.join(', ') || 'No sports selected'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-medium">{createdChallenge.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Privacy</p>
                    <p className="font-medium">{createdChallenge.isPublic ? 'Public' : 'Private'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Invite Code</p>
                    <p className="font-medium font-mono">{createdChallenge.inviteCode}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyShareLink}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Share Link</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQR(!showQR)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
                </motion.button>

                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-lg border border-gray-200"
                  >
                    <QRCode
                      value={`${getMainAppUrl()}/join/${createdChallenge.inviteCode}`}
                      size={200}
                      className="mx-auto"
                    />
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToRace}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Go to Challenge</span>
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Goal Setting Modal */}
        {showGoalModal && selectedSport && (
          <GoalSettingModal
            isOpen={showGoalModal}
            sports={[selectedSport]}
            onGoalsSet={handleGoalsSet}
            onClose={() => setShowGoalModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateChallenge;