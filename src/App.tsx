import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Layout/Header';
import LandingPage from './components/Home/LandingPage';
import CreateChallenge from './components/Challenge/CreateChallenge';
import RaceView from './components/Race/RaceView';
import StravaConnect from './components/Strava/StravaConnect';
import AuthCallback from './components/Auth/AuthCallback';
import TestStrava from './components/TestStrava';
import Profile from './components/Profile/Profile';
import MyChallenges from './components/Challenges/MyChallenges';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateChallenge />} />
            <Route path="/race/:challengeId" element={<RaceView />} />
            <Route path="/challenges" element={<MyChallenges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/strava" element={<StravaConnect onConnect={() => {}} isConnected={false} />} />
            <Route path="/api/auth/callback/strava" element={<AuthCallback />} />
            <Route path="/test-strava" element={<TestStrava />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;