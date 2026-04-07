import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ChallengeService } from '../../services/challengeService';

type Preset = { key: string; text: string };
type Taunt = {
  id: string;
  presetKey: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
};

export const TauntsPanel: React.FC<{ inviteCode: string; pollMs?: number }> = ({
  inviteCode,
  pollMs = 20000,
}) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [taunts, setTaunts] = useState<Taunt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => !!localStorage.getItem('session_token'), []);

  const load = async () => {
    try {
      const data = await ChallengeService.getTaunts(inviteCode, 20);
      setPresets(Array.isArray(data.presets) ? data.presets : []);
      setTaunts(Array.isArray(data.taunts) ? data.taunts : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load taunts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    const id = window.setInterval(() => {
      load().catch(() => {});
    }, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [inviteCode, pollMs]);

  const send = async (presetKey: string) => {
    try {
      setIsSending(true);
      setError(null);
      await ChallengeService.sendTaunt(inviteCode, presetKey);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send taunt');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
        <MessageSquare className="w-5 h-5 text-gray-700 mr-2" />
        Taunts
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Preset messages only. Keep it competitive.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((p) => (
          <button
            key={p.key}
            disabled={!canSend || isSending}
            onClick={() => send(p.key)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p.text}
          </button>
        ))}
        {presets.length === 0 && !isLoading && (
          <span className="text-sm text-gray-500">No presets available.</span>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-auto pr-1">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : taunts.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No taunts yet.</div>
        ) : (
          taunts.map((t) => (
            <div key={t.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <img
                src={
                  t.user.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || 'User')}&size=64&background=111827&color=fff`
                }
                alt={t.user.name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{t.user.name || 'User'}</span>{' '}
                  <span className="text-gray-700">{t.text}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TauntsPanel;

