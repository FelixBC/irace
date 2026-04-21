import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Layout/Header';
import LandingPage from './components/Home/LandingPage';
import RaceView from './components/Race/RaceView';
import CreateChallenge from './components/Challenge/CreateChallenge';
import Profile from './components/Profile/Profile';
import MyChallenges from './components/Challenges/MyChallenges';
import JoinChallenge from './components/Challenge/JoinChallenge';
import AuthCallback from './components/Auth/AuthCallback';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Footer from './components/Layout/Footer';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="App min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
                <Header />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/race/:challengeId" element={<RaceView />} />
                    <Route path="/join/:inviteCode" element={<JoinChallenge />} />
                    <Route path="/create" element={<CreateChallenge />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/my-challenges" element={<MyChallenges />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;