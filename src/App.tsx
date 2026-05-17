import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';

const LandingPage = lazy(() => import('./components/Home/LandingPage'));
const RaceView = lazy(() => import('./components/Race/RaceView'));
const CreateChallenge = lazy(() => import('./components/Challenge/CreateChallenge'));
const ProfilePage = lazy(() => import('./components/Profile/ProfilePage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));
const MyChallenges = lazy(() => import('./components/Challenges/MyChallenges'));
const JoinChallenge = lazy(() => import('./components/Challenge/JoinChallenge'));
const AuthCallback = lazy(() => import('./components/Auth/AuthCallback'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/Legal/TermsOfService'));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="App min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
                <Header />
                <div className="flex-1">
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/race/:challengeId" element={<RaceView />} />
                      <Route path="/join/:inviteCode" element={<JoinChallenge />} />
                      <Route path="/create" element={<CreateChallenge />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/my-challenges" element={<MyChallenges />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                    </Routes>
                  </Suspense>
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