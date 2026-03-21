import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <p className="text-gray-700 mb-4">
          iRace (“we”, “our”) helps small groups run invite-only fitness challenges. This policy describes
          how we handle personal data when you use our app with the{' '}
          <a href="https://www.strava.com/legal/api" className="text-orange-600 underline" target="_blank" rel="noreferrer">
            Strava API
          </a>
          . If anything here conflicts with Strava&apos;s terms or privacy policy, Strava&apos;s terms control for
          Strava data.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">What we collect</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>
            <strong>Account &amp; session:</strong> identifiers we issue when you sign in, and Strava OAuth tokens
            stored securely on our servers to access your activities as authorized.
          </li>
          <li>
            <strong>Challenge data:</strong> challenge settings, your participation, and aggregated progress (e.g.
            distances toward goals) needed to run a challenge.
          </li>
          <li>
            <strong>Usage &amp; logs:</strong> standard server logs (e.g. IP, timestamps) for security and debugging,
            as described in the Strava API Agreement regarding usage data.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">How we use data</h2>
        <p className="text-gray-700 mb-4">
          We use Strava data only to provide the service you asked for: syncing relevant activities into challenges
          you join or create. We do{' '}
          <strong>not</strong> sell Strava data, use it for advertising, or combine it with third-party datasets for
          analytics in ways prohibited by the Strava API Agreement.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Sharing with other users</h2>
        <p className="text-gray-700 mb-4">
          iRace is built as a <strong>community challenge</strong> product. When you join or create a challenge,
          you agree that <strong>aggregated challenge progress</strong> and a display name/avatar you use in the app
          may be visible to <strong>other participants in that same challenge</strong>. We do not show your full
          private Strava feed to other users.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Disconnecting Strava</h2>
        <p className="text-gray-700 mb-4">
          In <strong>Profile → Settings</strong>, <strong>Disconnect</strong> calls Strava&apos;s deauthorization API,
          removes OAuth tokens from our servers, and deletes activity rows we had synced from Strava for your account.
          Your session can stay signed in so you can reconnect later. You can also revoke the app anytime in{' '}
          <a
            href="https://www.strava.com/settings/apps"
            className="text-orange-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            Strava → Settings → My Apps
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Retention &amp; deletion</h2>
        <p className="text-gray-700 mb-4">
          We retain data only as long as needed to run the service. Challenge and participation records may remain so
          invite-only challenges stay coherent (e.g. who joined); they are not used to access Strava after you
          disconnect. For <strong>full account deletion</strong> or questions, contact{' '}
          <a className="text-orange-600" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          . We will complete verified requests within a reasonable time, consistent with applicable law and the Strava
          API Agreement.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Security</h2>
        <p className="text-gray-700 mb-4">
          We use HTTPS for data in transit. API secrets (e.g. Strava client secret) are kept on servers only — never
          embedded in the mobile or web client.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p className="text-gray-700">
          Questions or data requests:{' '}
          <a className="text-orange-600" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
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

export default PrivacyPolicy;
