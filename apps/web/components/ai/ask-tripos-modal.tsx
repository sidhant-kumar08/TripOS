import { useState } from 'react';
import { Send, X, ArrowRight, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

/**
 * Component: AskTripOSModal
 *
 * Design Principle (Doc 12 Section 14):
 * - Contextual Assistance over Monolithic Chatbots: Avoids occupying permanent screen space
 *   with a full-page bot. Instead, opens on-demand from the Command Center or trip layout.
 * - Grounded Trip Records: Synthesizes responses strictly from authorized DB queries (readiness score,
 *   pending tasks, balance records) to eliminate hallucination.
 * - Quick Action Chips: Provides 1-tap prompts for common questions ("What do I need to do?", "Who owes me money?").
 * - Interactive Navigation: Accompanies responses with deep-link action pills jumping directly to relevant modules.
 */
interface AskTripOSModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface QAResponse {
  question: string;
  answer: string;
  suggestedActions: Array<{
    label: string;
    actionType: string;
    targetPath?: string;
  }>;
}

const QUICK_PROMPTS = [
  'What do I need to do?',
  'What tasks are still pending?',
  'Who owes me money or what is my balance?',
  'Are we ready for the trip?',
];

export function AskTripOSModal({ tripId, isOpen, onClose }: AskTripOSModalProps) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await aiApi.ask(tripId, trimmed);
      setResponse(res.data);
      setQuestion('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-1.5">
                Ask TripOS
                <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                  Contextual AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">Grounded strictly in your authorized trip records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mb-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-medium">
            Quick Questions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setQuestion(prompt);
                  handleAsk(prompt);
                }}
                disabled={loading}
                className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/30 hover:text-indigo-200 transition-all text-left active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="my-6 flex flex-col items-center justify-center gap-2 py-4">
            <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Analyzing authorized trip state...</p>
          </div>
        )}

        {response && !loading && (
          <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-xs text-indigo-300/80 font-medium mb-1">Q: {response.question}</div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{response.answer}</p>

            {response.suggestedActions && response.suggestedActions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                {response.suggestedActions.map((action) => (
                  <Button
                    key={action.label}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (action.targetPath) {
                        onClose();
                        router.push(action.targetPath);
                      }
                    }}
                    className="text-xs flex items-center gap-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3 text-indigo-400" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex gap-2 pt-2 border-t border-white/10"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this trip..."
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Button
            type="submit"
            disabled={!question.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
