import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface TripBriefing {
  summary: string;
  readinessNote: string;
  attentionHighlight: string;
  financialHighlight: string;
  recommendedNextAction: string;
  generatedAt: string;
}

/**
 * Component: AIBriefingBanner
 *
 * Design Principle (Doc 12 Section 14):
 * - Executive Morning Briefing: Positioned at the top of the Command Center overview.
 *   Provides a calm, 2-to-3 sentence synthesis of trip readiness, blockers, financial state,
 *   and recommended next action.
 * - Non-blocking Progression: Renders gracefully with smooth loading states; core screens
 *   never crash or freeze if AI is temporarily unavailable.
 * - Interactive Triggers: Includes a 1-tap "Ask TripOS" launcher and on-demand refresh.
 */
interface AIBriefingBannerProps {
  tripId: string;
  onAskClick?: () => void;
}

export function AIBriefingBanner({ tripId, onAskClick }: AIBriefingBannerProps) {
  const [briefing, setBriefing] = useState<TripBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getBriefing(tripId);
      setBriefing(res.data);
    } catch {
      setError('Briefing temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchBriefing();
    }
  }, [tripId]);

  if (error && !briefing) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              TripOS Operations Briefing
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                Executive View
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Grounded synthesis of readiness, tasks, and balances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAskClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAskClick}
              className="h-8 text-xs text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30"
            >
              Ask TripOS
            </Button>
          )}
          <button
            onClick={fetchBriefing}
            disabled={loading}
            title="Refresh briefing"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !briefing ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
          Synthesizing operational briefing...
        </div>
      ) : briefing ? (
        <div className="pt-3">
          <p className="text-sm font-medium text-slate-100 leading-relaxed mb-3">
            {briefing.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Readiness State</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {briefing.readinessNote}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Pending Attention</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {briefing.attentionHighlight}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center gap-1.5 text-indigo-400 font-medium mb-1">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Recommended Action</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {briefing.recommendedNextAction}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
