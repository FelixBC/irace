import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Users, Trophy, Zap, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStravaAuthUrl } from '../../services/stravaService';
import SportAnimation from './SportAnimation';

const LandingPage: React.FC = () => {
  const { isConnectedToStrava } = useAuth();

  const stravaAuthUrl = getStravaAuthUrl('/');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Hero Section — iRace brand gradient, not Strava orange */}
      <div className="relative overflow-hidden hero-gradient">
        <style>{`
          .hero-gradient {
            background: linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%);
            background-size: 300% 300%;
            animation: gradient-shift 8s ease infinite;
          }
          @keyframes gradient-shift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-gradient { animation: none; background-position: 0% 50%; }
          }
        `}</style>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <Zap className="w-4 h-4" />
              <span>Invite-only fitness challenges</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Race Your Friends.
              <span className="block text-blue-200">Every Kilometer Counts.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto"
            >
              Create invite-only fitness challenges with friends and compete in real-time.
              Running, cycling, swimming, walking, hiking, and strength training — all tracked
              automatically from your connected account.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {isConnectedToStrava ? (
                <Link
                  to="/create"
                  className="inline-flex items-center space-x-2 bg-white text-brand hover:bg-blue-50 font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Challenge</span>
                </Link>
              ) : (
                /* Official Strava OAuth button — R4 compliant */
                <a
                  href={stravaAuthUrl}
                  className="focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2 focus:ring-offset-brand rounded-md"
                  aria-label="Connect with Strava to start"
                >
                  <img
                    src="/strava/btn_strava_connect_with_white.svg"
                    alt="Connect with Strava"
                    className="h-12 w-auto"
                  />
                </a>
              )}

              <Link
                to="/race/demo-challenge"
                className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
              >
                <Play className="w-5 h-5" />
                <span>View Demo Race</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-4"
            >
              {/* Powered by Strava lockup — white variant on dark/blue background */}
              <img
                src="/strava/api_logo_pwrdBy_strava_horiz_white.svg"
                alt="Powered by Strava"
                className="h-5 w-auto opacity-80"
              />
              <span className="text-blue-200 text-xs">·</span>
              <p className="text-xs text-blue-200">
                <a href="/privacy" className="hover:text-white underline">Privacy</a>
                {' · '}
                <a href="/terms" className="hover:text-white underline">Terms</a>
              </p>
            </motion.div>

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

        {/* Subtle ambient orbs — iRace blue palette only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 right-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-20 left-20 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"
          />
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Three steps to start racing with friends
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Plus className="w-8 h-8 text-brand" />,
                title: 'Create a Challenge',
                description: 'Set up a fitness challenge with your sport, goal, and duration. Choose who can join.',
                step: '01',
              },
              {
                icon: <Users className="w-8 h-8 text-brand" />,
                title: 'Invite Friends',
                description: 'Share your challenge link or QR code. Friends connect their accounts to join.',
                step: '02',
              },
              {
                icon: <Trophy className="w-8 h-8 text-brand" />,
                title: 'Race & Win',
                description: 'Track progress in real-time as everyone exercises. See who crosses the finish line first.',
                step: '03',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="relative bg-gray-50 dark:bg-gray-800/80 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700"
              >
                <div className="absolute top-4 right-4 text-4xl font-bold text-gray-200 dark:text-gray-700">
                  {feature.step}
                </div>
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Race Preview */}
      <div className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-gray-300">Live race visualization — real athlete progress</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Real-Time Race View</h3>
              <div className="space-y-4">
                {[
                  { icon: <Zap className="w-4 h-4" />, text: 'TypeRacer-style horizontal progress tracks per athlete' },
                  { icon: <Users className="w-4 h-4" />, text: 'Participant avatars and rank updated as activities sync' },
                  { icon: <Trophy className="w-4 h-4" />, text: 'Live leaderboard showing aggregated challenge progress' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/race/demo-challenge"
                className="inline-flex items-center space-x-2 mt-8 bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <Play className="w-4 h-4" />
                <span>Try Demo Race</span>
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl" aria-hidden="true">🏃</span>
                    <span className="font-semibold">Running — 3 days left</span>
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg h-16 relative overflow-hidden">
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <motion.div
                      animate={{ x: [0, 180, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-xs text-white font-bold"
                    >
                      A
                    </motion.div>
                    <motion.div
                      animate={{ x: [0, 130, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-xs text-white font-bold"
                    >
                      B
                    </motion.div>
                  </div>
                </div>
                <p className="text-sm text-white/60">Aggregate challenge progress — per activity detail stays private</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section — iRace brand blue, not Strava orange */}
      <div className="py-20 bg-brand">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Race?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Set up your first challenge in under two minutes.
          </p>

          {isConnectedToStrava ? (
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 bg-white hover:bg-blue-50 text-brand font-semibold py-4 px-8 rounded-xl transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Challenge</span>
            </Link>
          ) : (
            <a
              href={stravaAuthUrl}
              className="inline-block focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand rounded-md"
              aria-label="Connect with Strava to get started"
            >
              <img
                src="/strava/btn_strava_connect_with_white.svg"
                alt="Connect with Strava"
                className="h-12 w-auto mx-auto"
              />
            </a>
          )}

          <p className="mt-6 text-xs text-blue-200">
            iRace is not affiliated with or endorsed by Strava, Inc.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
