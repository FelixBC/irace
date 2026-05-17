import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileFooterStrip: React.FC = () => {
  const { isConnectedToStrava, logout } = useAuth();

  return (
    <footer className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isConnectedToStrava
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnectedToStrava ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            {isConnectedToStrava ? 'Strava connected' : 'Strava not connected'}
          </div>

          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>

        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </motion.button>
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        iRace is not affiliated with or endorsed by Strava, Inc. Strava® is a registered trademark of Strava, Inc.
      </p>
    </footer>
  );
};

export default ProfileFooterStrip;
