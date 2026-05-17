import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Attribution + disclaimer */}
          <div className="space-y-3">
            {/* Official Powered by Strava lockup — orange on light, white on dark */}
            <div>
              <img
                src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg"
                alt="Powered by Strava"
                className="h-6 w-auto dark:hidden"
              />
              <img
                src="/strava/api_logo_pwrdBy_strava_horiz_white.svg"
                alt="Powered by Strava"
                className="h-6 w-auto hidden dark:block"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              iRace is not affiliated with or endorsed by Strava, Inc. Strava® is a registered
              trademark of Strava, Inc. Strava data is used in accordance with the{' '}
              <a
                href="https://www.strava.com/legal/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 dark:hover:text-gray-200"
              >
                Strava API Agreement
              </a>
              .
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Support:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-gray-700 dark:hover:text-gray-200">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <Link to="/privacy" className="hover:text-brand transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-brand transition-colors">
              Terms
            </Link>
            <Link to="/settings" className="hover:text-brand transition-colors">
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
