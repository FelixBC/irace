import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, ExternalLink, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStravaAuthUrl } from '../../services/stravaService';
import { API_BASE_URL } from '../../config/api';
import {
  isWebPushConfigured,
  enableWebPush,
  disableWebPush,
  sendTestPushNotification,
} from '../../lib/pushNotifications';
import { getSessionToken } from '../../lib/apiClient';
import { createLogger } from '../../lib/logger';

type PushUiState = 'unsupported' | 'denied' | 'off' | 'on';

const log = createLogger('settings');

const SettingsPage: React.FC = () => {
  const { user, logout, isConnectedToStrava, disconnectStrava } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [stravaActionError, setStravaActionError] = useState<string | null>(null);
  const [pushUiState, setPushUiState] = useState<PushUiState>('unsupported');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    const refreshPushUi = async () => {
      if (!isWebPushConfigured()) { setPushUiState('unsupported'); return; }
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
        setPushUiState('unsupported'); return;
      }
      if (Notification.permission === 'denied') { setPushUiState('denied'); return; }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        const sub = await reg?.pushManager.getSubscription();
        setPushUiState(sub ? 'on' : 'off');
      } catch (pushRegistrationError) {
        log.warn('could not read push subscription state', pushRegistrationError);
        setPushUiState('off');
      }
    };
    void refreshPushUi();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Push Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {pushUiState === 'unsupported' &&
                      'Not configured for this build (add VITE_VAPID_PUBLIC_KEY).'}
                    {pushUiState === 'denied' &&
                      'Blocked in browser settings — enable notifications for this site.'}
                    {(pushUiState === 'off' || pushUiState === 'on') &&
                      'Challenge updates and nudges in your browser.'}
                  </p>
                </div>
              </div>
              <label
                className={`relative inline-flex items-center shrink-0 ${
                  pushBusy || pushUiState === 'unsupported' || pushUiState === 'denied'
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushUiState === 'on'}
                  disabled={pushBusy || pushUiState === 'unsupported' || pushUiState === 'denied'}
                  onChange={async (e) => {
                    const token = getSessionToken();
                    if (!token) { setPushMessage('Sign in to enable notifications.'); return; }
                    setPushBusy(true);
                    setPushMessage(null);
                    try {
                      if (e.target.checked) {
                        const perm = await Notification.requestPermission();
                        if (perm !== 'granted') {
                          setPushUiState('denied');
                          setPushMessage('Notifications were blocked.');
                          return;
                        }
                        const ok = await enableWebPush(token, API_BASE_URL);
                        setPushUiState(ok ? 'on' : 'off');
                        if (!ok) {
                          setPushMessage(
                            'Could not subscribe. Check VAPID env vars and run DB migrations.'
                          );
                        }
                      } else {
                        await disableWebPush(token, API_BASE_URL);
                        setPushUiState('off');
                      }
                    } catch (pushToggleError) {
                      log.error('push toggle failed', pushToggleError);
                      setPushMessage('Something went wrong.');
                      setPushUiState('off');
                    } finally {
                      setPushBusy(false);
                    }
                  }}
                />
                <div
                  className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all relative ${
                    pushUiState === 'on'
                      ? 'bg-brand after:translate-x-full after:border-white'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              </label>
            </div>
            {pushMessage && <p className="text-sm text-red-600">{pushMessage}</p>}
            {import.meta.env.DEV && isWebPushConfigured() && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Dev only:</span>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={pushBusy || pushUiState !== 'on'}
                  onClick={async () => {
                    const token = getSessionToken();
                    if (!token) return;
                    setPushBusy(true);
                    setPushMessage(null);
                    try {
                      const r = await sendTestPushNotification(token, API_BASE_URL);
                      if (!r.ok) setPushMessage(r.error || 'Test failed');
                    } catch (testPushError) {
                      log.error('test push request failed', testPushError);
                      setPushMessage('Test request failed');
                    } finally {
                      setPushBusy(false);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Send test notification
                </motion.button>
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Profile privacy</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Control who can see your profile</p>
                </div>
              </div>
              <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]">
                <option>Public</option>
                <option>Friends Only</option>
                <option>Private</option>
              </select>
            </div>
          </div>

          {/* Strava Connection */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Strava connection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isConnectedToStrava ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {isConnectedToStrava ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  disabled={isDisconnecting}
                  onClick={async () => {
                    setStravaActionError(null);
                    setIsDisconnecting(true);
                    try {
                      await disconnectStrava();
                    } catch (disconnectError) {
                      log.error('disconnect strava failed', disconnectError);
                      setStravaActionError(
                        'Disconnect failed. You can also remove the app in Strava settings.'
                      );
                    } finally {
                      setIsDisconnecting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 shrink-0"
                >
                  {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  onClick={() => {
                    setStravaActionError(null);
                    window.location.href = getStravaAuthUrl('/settings');
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2 rounded-md shrink-0"
                  aria-label="Connect with Strava"
                >
                  <img
                    src="/strava/btn_strava_connect_with_orange.svg"
                    alt="Connect with Strava"
                    className="h-10 w-auto dark:hidden"
                  />
                  <img
                    src="/strava/btn_strava_connect_with_white.svg"
                    alt="Connect with Strava"
                    className="h-10 w-auto hidden dark:block"
                  />
                </motion.button>
              )}
            </div>
            {isConnectedToStrava && (
              <p className="text-xs text-gray-500">
                Manage or revoke access in{' '}
                <a
                  href="https://www.strava.com/settings/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-strava-orange"
                >
                  Strava → Settings → My Apps
                </a>
                .
              </p>
            )}
            {stravaActionError && <p className="text-sm text-red-600">{stravaActionError}</p>}
          </div>

          {/* Sign out */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">Sign out</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Sign out of your account</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign out
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
