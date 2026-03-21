import React from 'react';

/** Dev-only placeholder — do not put Strava API secrets in client code. */
const TestStrava: React.FC = () => {
  return (
    <div className="p-4 text-sm text-gray-600">
      Strava connectivity is tested via the real OAuth flow and server APIs. Client-side credential tests were
      removed for security.
    </div>
  );
};

export default TestStrava;
