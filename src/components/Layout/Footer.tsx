import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="space-y-2">
            <p>
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-medium hover:underline"
              >
                Strava
              </a>{' '}
              data is used in accordance with the{' '}
              <a
                href="https://www.strava.com/legal/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 underline"
              >
                Strava API Agreement
              </a>
              . Strava® is a registered trademark of Strava, Inc.
            </p>
            <p>
              Support:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-600 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-orange-600">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-orange-600">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
