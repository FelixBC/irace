import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, QrCode, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sport, Challenge } from '../../types';
import { ChallengeService, CreateChallengeData } from '../../services/challengeService';
import { addDays } from 'date-fns';
import QRCode from 'react-qr-code';

const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    sports: [] as Sport[],
    duration: 7,
    isPrivate: false,
  });
  const [createdChallenge, setCreatedChallenge] = useState<Challenge | null>(null);
  const [showQR, setShowQR] = useState(false);

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
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const handleNext = () => {
    if (step === 1 && formData.name.trim() && formData.sports.length > 0) {
      setStep(2);
    }
  };

  const handleCreateChallenge = () => {
    const challengeData: CreateChallengeData = {
      name: formData.name,
      sports: formData.sports,
      duration: formData.duration,
      isPrivate: formData.isPrivate,
    };

    const newChallenge = ChallengeService.createChallenge(challengeData, '1'); // Mock user ID for now
    setCreatedChallenge(newChallenge);
    setStep(3);
  };

  const copyShareLink = () => {
    if (createdChallenge) {
      const shareUrl = `${window.location.origin}/race/${createdChallenge.inviteCode}`;
      navigator.clipboard.writeText(shareUrl);
      // In a real app, show success toast
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sportOptions.map((sport) => (
                    <motion.button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.sports.includes(sport.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-3xl mb-2 block">{sport.icon}</span>
                        <p className="font-medium text-gray-900">{sport.name}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select at least one sport for your challenge
                </p>
              </div>

              <button
                onClick={handleNext}
                disabled={!formData.name.trim() || formData.sports.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
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

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateChallenge}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Create Challenge</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && createdChallenge && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-green-500"
                >
                  ✓
                </motion.div>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Challenge Created Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Your challenge "{createdChallenge.name}" is ready to go.
                Share it with friends to start competing!
              </p>

              {/* Share Options */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Share URL:</p>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="text"
                    value={`${window.location.origin}/race/${createdChallenge.inviteCode}`}
                    readOnly
                    className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={copyShareLink}
                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {showQR && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-white rounded-lg"
                  >
                    <QRCode
                      value={`${window.location.origin}/race/${createdChallenge.inviteCode}`}
                      size={128}
                      className="mx-auto"
                    />
                  </motion.div>
                )}
              </div>

              <button
                onClick={goToRace}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Go to Race</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreateChallenge;