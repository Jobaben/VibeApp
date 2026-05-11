import { useState } from 'react';
import { AxiosError } from 'axios';
import { aiApi } from '../services/api';
import type { AIInsight, AIErrorCode } from '../types/ai';

type PanelState =
  | { kind: 'collapsed' }
  | { kind: 'loading' }
  | { kind: 'loaded'; insight: AIInsight }
  | { kind: 'error'; code: AIErrorCode | 'unknown'; retryAfterSec: number | null }
  | { kind: 'disabled' };

const DISCLAIMER =
  'AI-generated analysis based on current fundamentals. Not investment advice. Always do your own research.';

const ERROR_SUBTEXT: Record<AIErrorCode | 'unknown', string> = {
  llm_unavailable: 'The AI service is temporarily unreachable.',
  llm_schema_error: "The AI response didn't pass validation.",
  rate_limited: 'Too many requests — try again in a minute.',
  unknown: 'An unexpected error occurred.',
};

type Props = { ticker: string };

export function AIAnalysisPanel({ ticker }: Props) {
  const [state, setState] = useState<PanelState>({ kind: 'collapsed' });

  async function expand() {
    if (state.kind === 'loaded' || state.kind === 'disabled') return;
    setState({ kind: 'loading' });
    try {
      const res = await aiApi.getDeepAnalysis(ticker);
      if (res.headers['x-ai-status'] === 'disabled') {
        setState({ kind: 'disabled' });
        return;
      }
      setState({ kind: 'loaded', insight: res.data.stock.ai_insights });
    } catch (err) {
      const axErr = err as AxiosError<{ detail?: { code?: AIErrorCode } }>;
      const code = (axErr.response?.data?.detail?.code as AIErrorCode) ?? 'unknown';
      const retryAfter = axErr.response?.headers?.['retry-after'];
      setState({
        kind: 'error',
        code,
        retryAfterSec: retryAfter ? Number(retryAfter) : null,
      });
    }
  }

  function collapse() {
    if (state.kind === 'loaded') setState({ kind: 'collapsed' });
  }

  return (
    <section
      className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 mt-4"
      data-testid="ai-analysis-panel"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">🧠 AI Analysis</h3>
        {state.kind === 'collapsed' && (
          <button
            type="button"
            onClick={expand}
            className="text-xs text-purple-300 hover:text-purple-200"
          >
            Show analysis
          </button>
        )}
        {state.kind === 'loaded' && (
          <button
            type="button"
            onClick={collapse}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Hide
          </button>
        )}
      </header>

      {state.kind === 'loading' && (
        <div className="mt-3 text-sm text-slate-300">
          <p>Generating analysis…</p>
          <p className="text-xs text-slate-500 mt-1">
            First fetch can take a few seconds. Cached results are instant.
          </p>
        </div>
      )}

      {state.kind === 'loaded' && (
        <div className="mt-3 grid gap-3 text-sm">
          <InsightList title="Strengths" accent="green" items={state.insight.strengths} />
          <InsightList title="Weaknesses" accent="amber" items={state.insight.weaknesses} />
          <InsightList title="Watch for" accent="blue" items={state.insight.catalyst_watch} />
          <p className="text-xs text-slate-500 italic mt-2">{DISCLAIMER}</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="mt-3 text-sm">
          <p className="text-red-300">AI analysis temporarily unavailable</p>
          <p className="text-xs text-slate-500 mt-1">{ERROR_SUBTEXT[state.code]}</p>
          <button
            type="button"
            onClick={expand}
            disabled={state.code === 'rate_limited'}
            className="mt-2 text-xs text-purple-300 hover:text-purple-200 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            Retry
          </button>
        </div>
      )}

      {state.kind === 'disabled' && (
        <div className="mt-3 text-sm text-slate-400">
          <p>AI analysis is disabled in this environment.</p>
        </div>
      )}
    </section>
  );
}

const ACCENT_CLASS: Record<'green' | 'amber' | 'blue', string> = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  blue: 'text-sky-300',
};

function InsightList({
  title,
  accent,
  items,
}: {
  title: string;
  accent: 'green' | 'amber' | 'blue';
  items: string[];
}) {
  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-wide ${ACCENT_CLASS[accent]}`}>
        {title}
      </h4>
      <ul className="mt-1 list-disc list-inside text-slate-200 space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
