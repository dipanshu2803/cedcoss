import React from 'react';
import { ThumbsUp, AlertCircle, TrendingUp, Sparkles, Package, Truck, Award, ShieldAlert } from 'lucide-react';

const TOPIC_ICONS = {
  quality: Award,
  delivery: Truck,
  packaging: Package,
  size_fit: Package,
  price: TrendingUp,
  support: ShieldAlert,
  other: Sparkles
};

export default function InsightsSection({ topComplaints = [], topPraises = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top 3 Customer Complaints */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Top 3 Customer Complaints</h2>
              <p className="text-xs text-slate-500">Primary friction points driving customer dissatisfaction</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Action Needed
          </span>
        </div>

        <div className="space-y-3">
          {topComplaints.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No major complaints found in dataset.</p>
          ) : (
            topComplaints.map((item, index) => {
              const Icon = TOPIC_ICONS[item.topic] || AlertCircle;
              return (
                <div
                  key={item.topic}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50/20 transition-all flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs mt-0.5">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Icon className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-xs font-bold text-slate-800 capitalize">{item.title}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {item.count} {item.count === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{item.summary}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top 3 Customer Praises */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Top 3 Customer Praises</h2>
              <p className="text-xs text-slate-500">What customers love most about your products</p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Strengths
          </span>
        </div>

        <div className="space-y-3">
          {topPraises.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No praises found in dataset.</p>
          ) : (
            topPraises.map((item, index) => {
              const Icon = TOPIC_ICONS[item.topic] || Award;
              return (
                <div
                  key={item.topic}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs mt-0.5">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Icon className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 capitalize">{item.title}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {item.count} {item.count === 1 ? 'mention' : 'mentions'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{item.summary}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
