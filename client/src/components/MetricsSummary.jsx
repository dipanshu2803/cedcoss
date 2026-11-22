import React from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Reply, ShieldCheck, Scale, Zap } from 'lucide-react';

export default function MetricsSummary({ summary, cleaningStats, metrics }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Reviews Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Analyzed</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900">{summary.total_reviews_analyzed}</span>
          <span className="text-xs text-slate-500">reviews</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          {cleaningStats?.duplicate_rows > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              {cleaningStats.duplicate_rows} duplicate reused
            </span>
          )}
          {cleaningStats?.empty_rows > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {cleaningStats.empty_rows} empty skipped
            </span>
          )}
        </div>
      </div>

      {/* Sentiment Breakdown Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sentiment Split</span>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          </div>
        </div>
        <div className="flex items-baseline space-x-3 text-slate-900 font-bold">
          <span className="text-emerald-600 text-2xl font-extrabold">{summary.pct_positive}%</span>
          <span className="text-xs text-slate-400 font-normal">/</span>
          <span className="text-amber-600 text-lg font-bold">{summary.pct_neutral}%</span>
          <span className="text-xs text-slate-400 font-normal">/</span>
          <span className="text-rose-600 text-2xl font-extrabold">{summary.pct_negative}%</span>
        </div>
        {/* Visual Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 flex overflow-hidden">
          <div style={{ width: `${summary.pct_positive}%` }} className="bg-emerald-500 h-full" title={`Positive: ${summary.positive_count}`}></div>
          <div style={{ width: `${summary.pct_neutral}%` }} className="bg-amber-400 h-full" title={`Neutral: ${summary.neutral_count}`}></div>
          <div style={{ width: `${summary.pct_negative}%` }} className="bg-rose-500 h-full" title={`Negative: ${summary.negative_count}`}></div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
          <span>{summary.positive_count} Pos</span>
          <span>{summary.neutral_count} Neu</span>
          <span>{summary.negative_count} Neg</span>
        </div>
      </div>

      {/* Needs Reply Urgent Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Needs Response</span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Reply className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-rose-600">{summary.needs_reply_count}</span>
          <span className="text-xs font-medium text-rose-600/80">urgent reviews</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Complaints, defective items, or unresolved tickets requiring merchant attention
        </p>
      </div>

      {/* Rating vs Sentiment Agreement (Bonus Card) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rating Agreement</span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900">{summary.rating_agreement_pct}%</span>
          <span className="text-xs text-slate-500">stars vs AI</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] text-slate-500">
            Flags sarcastic & mismatched ratings (e.g. R008: 5★ terrible)
          </span>
        </div>
      </div>
    </div>
  );
}
