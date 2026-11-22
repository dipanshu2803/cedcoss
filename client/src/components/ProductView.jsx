import React from 'react';
import { Package, ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle } from 'lucide-react';

export default function ProductView({ products = [], selectedProduct, onSelectProduct }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Product Analytics Hub</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Bonus Feature
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Drill down into product-specific sentiment breakdown, issue frequencies, and needs-reply counts
          </p>
        </div>

        {/* Product selector buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => onSelectProduct('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedProduct === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({products.reduce((acc, p) => acc + p.total, 0)})
          </button>
          {products.map(p => (
            <button
              key={p.product}
              onClick={() => onSelectProduct(p.product)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProduct === p.product
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.product} ({p.total})
            </button>
          ))}
        </div>
      </div>

      {/* Cards per product */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products
          .filter(p => selectedProduct === 'all' || selectedProduct === p.product)
          .map(prod => (
            <div
              key={prod.product}
              onClick={() => onSelectProduct(prod.product)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedProduct === prod.product
                  ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-50'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{prod.product}</h4>
                    <span className="text-[11px] text-slate-500">{prod.total} reviews</span>
                  </div>
                </div>
                {prod.needs_reply > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {prod.needs_reply} needs reply
                  </span>
                )}
              </div>

              {/* Sentiment mini bar */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span className="text-emerald-700">{prod.pct_positive}% Positive</span>
                  <span className="text-rose-700">{prod.pct_negative}% Negative</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 flex overflow-hidden">
                  <div style={{ width: `${prod.pct_positive}%` }} className="bg-emerald-500 h-full"></div>
                  <div style={{ width: `${100 - prod.pct_positive - prod.pct_negative}%` }} className="bg-amber-400 h-full"></div>
                  <div style={{ width: `${prod.pct_negative}%` }} className="bg-rose-500 h-full"></div>
                </div>
              </div>

              {/* Top topics tags */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(prod.topics || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([topic, count]) => (
                    <span
                      key={topic}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium capitalize"
                    >
                      {topic.replace('_', '/')}: {count}
                    </span>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
