import React from 'react';
import { Sparkles, Database, ShieldCheck, RefreshCw, Cpu } from 'lucide-react';

export default function Header({ serverStatus, onReset }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 ring-4 ring-indigo-50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ReviewLens</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                AI Store Copilot
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Turn messy customer reviews into actionable store insights in one screen
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Active provider */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500">Model:</span>
            <span className="font-semibold">{serverStatus?.activeProvider || 'Connecting...'}</span>
          </div>

          {/* Cache engine status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cache:</span>
            <span className="font-semibold uppercase">{serverStatus?.cache?.engine || 'Active'}</span>
            <span className="text-emerald-600">({serverStatus?.cache?.cachedEntries || 0})</span>
          </div>

          {/* Prompt injection defense active badge */}
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">R012 Defense Active</span>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              title="Reset dashboard"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
