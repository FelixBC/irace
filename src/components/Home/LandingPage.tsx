import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Users, Trophy, Zap, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStravaAuthUrl } from '../../services/stravaService';
import SportAnimation from './SportAnimation';

const LandingPage: React.FC = () => {
  const { isConnectedToStrava } = useAuth();

  const handleStravaConnect = () => {
    if (!isConnectedToStrava) {
      const authUrl = getStravaAuthUrl();
      window.location.href = authUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-950 transition-colors">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
            >
              <span className="block">Race Your Friends with</span>
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Real Strava Data
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto"
            >
              Create fitness challenges with friends and compete in real-time using your actual 
              running, cycling, swimming, walking, hiking, and strength training activities from Strava. TypeRacer meets fitness!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              {isConnectedToStrava ? (
                <Link
                  to="/create"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Challenge</span>
                </Link>
              ) : (
                <button
                  onClick={handleStravaConnect}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <span>Connect Strava to Start</span>
                </button>
              )}
              
              <Link
                to="/race/demo-challenge"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-4 px-8 rounded-xl transition-colors flex items-center space-x-2 border border-gray-200 dark:border-gray-600 shadow-lg"
              >
                <Play className="w-5 h-5" />
                <span>View Demo Race</span>
              </Link>
            </motion.div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              <a href="/privacy" className="text-orange-600 hover:underline">
                Privacy
              </a>
              {' · '}
              <a href="/terms" className="text-orange-600 hover:underline">
                Terms
              </a>
            </p>

            {/* Sport Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16"
            >
              <SportAnimation />
            </motion.div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-orange-400 to-red-500 rounded-full opacity-10"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              y: [0, -20, 0],
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-blue-400 to-teal-500 rounded-full opacity-10"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Three simple steps to start racing with friends
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Plus className="w-8 h-8 text-orange-500" />,
                title: 'Create Challenge',
                description: 'Set up a fitness challenge with running, cycling, swimming, walking, hiking, or strength training. Choose duration and invite friends.',
                step: '01'
              },
              {
                icon: <Users className="w-8 h-8 text-blue-500" />,
                title: 'Invite Friends',
                description: 'Share your challenge link or QR code. Friends connect their Strava accounts to join.',
                step: '02'
              },
              {
                icon: <Trophy className="w-8 h-8 text-green-500" />,
                title: 'Race & Win',
                description: 'Watch progress in real-time as everyone exercises. See who reaches the finish line first!',
                step: '03'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="relative bg-gray-50 dark:bg-gray-800/80 rounded-xl p-8 text-center border border-transparent dark:border-gray-700"
              >
                <div className="absolute top-4 right-4 text-4xl font-bold text-gray-200 dark:text-gray-600">
                  {feature.step}
                </div>
                <div className="mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Race Preview */}
      <div className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-300">
              Experience the TypeRacer-style fitness competition
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                Real-Time Race Visualization
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span>Live progress tracking with TypeRacer-style horizontal tracks</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Participant avatars moving along the race track</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span>Real-time leaderboards and activity feeds</span>
                </div>
              </div>

              <Link
                to="/race/demo-challenge"
                className="inline-flex items-center space-x-2 mt-8 bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Try Demo Race</span>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              {/* Mock Race Track Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🏃‍♂️</span>
                    <span className="font-semibold">Running</span>
                  </div>
                  <span className="text-sm opacity-75">3 days left</span>
                </div>
                
                <div className="bg-white/20 rounded-lg h-16 relative overflow-hidden">
                  <div className="absolute top-2 left-4 flex space-x-2">
                    <motion.div
                      animate={{ x: [0, 200, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-8 h-8 bg-orange-500 rounded-full"
                    />
                    <motion.div
                      animate={{ x: [0, 150, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="w-8 h-8 bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div className="text-sm opacity-75">
                  Real participants racing in real-time
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-orange-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Race Your Friends?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of fitness enthusiasts competing in real-time challenges
          </p>
          
          {isConnectedToStrava ? (
            <Link
              to="/create"
              className="bg-white hover:bg-gray-100 text-orange-500 font-semibold py-4 px-8 rounded-xl transition-colors inline-flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Challenge</span>
            </Link>
          ) : (
            <button
              onClick={handleStravaConnect}
              className="bg-white hover:bg-gray-100 text-orange-500 font-semibold py-4 px-8 rounded-xl transition-colors inline-flex items-center space-x-2 shadow-lg"
            >
              <span>Get Started with Strava</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;