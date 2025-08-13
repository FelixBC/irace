import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Menu, X, Trophy, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStravaAuthUrl } from '../../services/stravaService';

const Header: React.FC = () => {
  const { user, logout, isConnectedToStrava, connectStrava } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleStravaLogin = () => {
    if (!isConnectedToStrava) {
      const authUrl = getStravaAuthUrl();
      window.location.href = authUrl;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center"
            >
              <Trophy className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900">StravaRacer</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/create"
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Challenge</span>
            </Link>
            <Link
              to="/challenges"
              className="text-gray-600 hover:text-orange-500 transition-colors"
            >
              My Challenges
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={user.image || 'https://via.placeholder.com/32x32'}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user.name || 'Strava User'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/challenges"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Challenges
                    </Link>
                    {isConnectedToStrava && (
                      <button
                        onClick={() => {
                          // This will disconnect from Strava but keep the user logged in
                          // You might want to implement a proper disconnect function
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Disconnect Strava
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <button
                onClick={handleStravaLogin}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isConnectedToStrava 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {isConnectedToStrava ? 'Connected to Strava' : 'Connect Strava'}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <nav className="flex flex-col space-y-4">
              <Link
                to="/create"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="w-4 h-4" />
                <span>Create Challenge</span>
              </Link>
              <Link
                to="/challenges"
                className="text-gray-600 hover:text-orange-500 transition-colors"
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