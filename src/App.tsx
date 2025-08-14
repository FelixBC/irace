import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Layout/Header';
import LandingPage from './components/Home/LandingPage';
import RaceView from './components/Race/RaceView';
import CreateChallenge from './components/Challenge/CreateChallenge';
import Profile from './components/Profile/Profile';
import MyChallenges from './components/Challenges/MyChallenges';
import AuthCallback from './components/Auth/AuthCallback';
import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Header />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/race/:challengeId" element={<RaceView />} />
                <Route path="/create" element={<CreateChallenge />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-challenges" element={<MyChallenges />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;