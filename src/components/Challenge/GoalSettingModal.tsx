import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Sliders } from 'lucide-react';
import { Sport } from '../../types';

interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sports: Sport[];
  onGoalsSet: (goals: Record<Sport, number>) => void;
}

interface SportGoal {
  sport: Sport;
  goal: number;
  unit: string;
}

const GoalSettingModal: React.FC<GoalSettingModalProps> = ({
  isOpen,
  onClose,
  sports,
  onGoalsSet,
}) => {
  const [sportGoals, setSportGoals] = useState<SportGoal[]>([]);

  // Sport-specific presets and units
  const sportConfig = {
    [Sport.RUNNING]: {
      icon: '🏃‍♂️',
      name: 'Running',
      unit: 'km',
      presets: [5, 10, 21, 42, 50, 100],
      defaultGoal: 21,
    },
    [Sport.CYCLING]: {
      icon: '🚴‍♂️',
      name: 'Cycling',
      unit: 'km',
      presets: [25, 50, 100, 150, 200, 300],
      defaultGoal: 100,
    },
    [Sport.SWIMMING]: {
      icon: '🏊‍♂️',
      name: 'Swimming',
      unit: 'km',
      presets: [1, 2, 5, 10, 20, 50],
      defaultGoal: 5,
    },
    [Sport.WALKING]: {
      icon: '🚶‍♂️',
      name: 'Walking',
      unit: 'km',
      presets: [5, 10, 20, 30, 50, 100],
      defaultGoal: 20,
    },
    [Sport.HIKING]: {
      icon: '🥾',
      name: 'Hiking',
      unit: 'km',
      presets: [5, 10, 20, 30, 50, 100],
      defaultGoal: 20,
    },
    [Sport.WEIGHT_TRAINING]: {
      icon: '💪',
      name: 'Strength Training',
      unit: 'sessions',
      presets: [5, 10, 15, 20, 30, 50],
      defaultGoal: 15,
    },
  };

  // Initialize sport goals when modal opens
  React.useEffect(() => {
    if (isOpen && sports.length > 0) {
      const initialGoals: SportGoal[] = sports.map(sport => ({
        sport,
        goal: sportConfig[sport].defaultGoal,
        unit: sportConfig[sport].unit,
      }));
      setSportGoals(initialGoals);
    }
  }, [isOpen, sports]);

  const handleGoalChange = (sport: Sport, newGoal: number) => {
    setSportGoals(prev => 
      prev.map(sg => 
        sg.sport === sport ? { ...sg, goal: Math.max(0, newGoal) } : sg
      )
    );
  };

  const handlePresetClick = (sport: Sport, preset: number) => {
    handleGoalChange(sport, preset);
  };

  const handleSubmit = () => {
    const goals: Record<Sport, number> = {};
    sportGoals.forEach(sg => {
      goals[sg.sport] = sg.goal;
    });
    onGoalsSet(goals);
    onClose();
  };

  const canSubmit = sportGoals.every(sg => sg.goal > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 z-50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{sportGoals[0]?.sport ? sportConfig[sportGoals[0].sport].icon : '🎯'}</span>
                <h2 className="text-xl font-semibold text-gray-900">
                  Set {sportGoals[0]?.sport ? sportConfig[sportGoals[0].sport].name : 'Sport'} Goal
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Choose your target distance or sessions for this challenge
            </p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {sportGoals.map((sportGoal) => {
              const config = sportConfig[sportGoal.sport];
              return (
                <motion.div
                  key={sportGoal.sport}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Quick Presets */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Quick Presets:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {config.presets.map((preset) => (
                        <motion.button
                          key={preset}
                          onClick={() => handlePresetClick(sportGoal.sport, preset)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                            sportGoal.goal === preset
                              ? 'bg-orange-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {preset} {config.unit}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Goal:
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={sportGoal.goal}
                        onChange={(e) => handleGoalChange(sportGoal.sport, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg font-medium"
                        placeholder={`Enter ${config.name.toLowerCase()} goal`}
                      />
                      <span className="text-gray-600 font-medium min-w-[3rem] text-lg">
                        {config.unit}
                      </span>
                    </div>
                  </div>

                  {/* Slider for visual input */}
                  <div>
                    <div className="flex items-center space-x-3">
                      <Sliders className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max={Math.max(...config.presets) * 1.5}
                        step="0.1"
                        value={sportGoal.goal}
                        onChange={(e) => handleGoalChange(sportGoal.sport, parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm text-gray-500 min-w-[4rem] text-right font-medium">
                        {sportGoal.goal} {config.unit}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>Set Goal</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalSettingModal;
