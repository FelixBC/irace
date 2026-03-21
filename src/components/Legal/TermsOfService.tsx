import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <p className="text-gray-700 mb-4">
          By using iRace, you agree to these terms and to comply with{' '}
          <a href="https://www.strava.com/legal/api" className="text-orange-600 underline" target="_blank" rel="noreferrer">
            Strava&apos;s API Agreement
          </a>
          ,{' '}
          <a href="https://www.strava.com/legal/terms" className="text-orange-600 underline" target="_blank" rel="noreferrer">
            Terms of Service
          </a>
          , and{' '}
          <a href="https://www.strava.com/legal/privacy" className="text-orange-600 underline" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>{' '}
          as they apply to your use of Strava data.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">The service</h2>
        <p className="text-gray-700 mb-4">
          iRace provides invite-only group challenges. It is not affiliated with or endorsed by Strava. Strava®
          is a registered trademark of Strava, Inc.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Strava connection</h2>
        <p className="text-gray-700 mb-4">
          Connecting Strava is optional for browsing some parts of the app, but required to sync activities into
          challenges. You may disconnect in <strong>Profile → Settings</strong> or revoke access in Strava; see our{' '}
          <Link to="/privacy" className="text-orange-600 underline">
            Privacy Policy
          </Link>{' '}
          for what we remove when you disconnect.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Acceptable use</h2>
        <p className="text-gray-700 mb-4">
          You will not misuse the API, harass other users, or attempt to scrape or re-export Strava data beyond what
          the app displays to you as part of challenges you participate in.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Disclaimer</h2>
        <p className="text-gray-700 mb-4">
          The app is provided “as is” without warranties. Fitness activities carry risk; you use the service at your
          own discretion.
        </p>

        <p className="mt-10">
          <Link to="/" className="text-orange-600 font-medium">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
