import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Trophy, Plus, LogOut, Home, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getStravaAuthUrl } from '../../services/stravaService';
import { createLogger } from '../../lib/logger';

const log = createLogger('header');

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isConnectedToStrava, disconnectStrava } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo — iRace brand blue, not Strava orange */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 bg-gradient-to-r from-brand-dark to-brand rounded-full flex items-center justify-center"
            >
              <Trophy className="w-4 h-4 text-white" />
            </motion.div>
            <motion.span
              className="text-xl font-bold text-gray-900 dark:text-white"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              iRace
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link
                to="/create"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                <span>Create Challenge</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link
                to="/my-challenges"
                className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
              >
                My Challenges
              </Link>
            </motion.div>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.button
              type="button"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <img
                    src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=32&background=2563EB&color=fff`}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.name || 'Athlete'}
                  </span>
                </motion.button>

                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Link
                        to="/my-challenges"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Challenges
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                    </motion.div>
                    {isConnectedToStrava && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            try {
                              await disconnectStrava();
                            } catch (disconnectError) {
                              log.error('disconnect strava failed', disconnectError);
                              window.alert('Could not disconnect Strava. Try again or remove the app in Strava settings.');
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          Disconnect Strava
                        </button>
                      </motion.div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Logout
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Official Strava connect button for unauthenticated users */
              <motion.a
                href={getStravaAuthUrl(location.pathname)}
                onClick={(e) => { if (isConnectedToStrava) e.preventDefault(); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
                aria-label="Connect with Strava"
              >
                <img
                  src="/strava/btn_strava_connect_with_orange.svg"
                  alt="Connect with Strava"
                  className="h-10 w-auto dark:hidden"
                />
                <img
                  src="/strava/btn_strava_connect_with_white.svg"
                  alt="Connect with Strava"
                  className="h-10 w-auto hidden dark:block"
                />
              </motion.a>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
          >
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/create"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="w-4 h-4" />
                <span>Create Challenge</span>
              </Link>
              <Link
                to="/my-challenges"
                className="text-gray-600 dark:text-gray-300 hover:text-brand transition-colors px-3 py-2 rounded-lg hover:bg-brand-faint dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                My Challenges
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
