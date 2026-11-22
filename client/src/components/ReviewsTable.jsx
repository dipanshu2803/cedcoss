import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  HelpCircle,
  AlertTriangle,
  Reply,
  CheckCircle,
  Copy,
  Languages,
  ShieldCheck,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export default function ReviewsTable({
  reviews = [],
  selectedProduct = 'all',
  onSelectProduct,
  onOpenReplyModal,
  repliedReviewIds = new Set()
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [mismatchOnly, setMismatchOnly] = useState(false);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      // Product filter
      if (selectedProduct !== 'all' && r.product !== selectedProduct) {
        return false;
      }

      // Sentiment filter
      if (sentimentFilter !== 'all') {
        const sentiment = r.analysis?.sentiment || (r.status === 'analysis_failed' ? 'analysis_failed' : 'skipped');
        if (sentiment !== sentimentFilter) return false;
      }

      // Topic filter
      if (topicFilter !== 'all') {
        const topics = r.analysis?.topics || [];
        if (!topics.includes(topicFilter)) return false;
      }

      // Needs reply filter
      if (needsReplyOnly && !r.analysis?.needs_reply) {
        return false;
      }

      // Rating mismatch filter
      if (mismatchOnly && (!r.rating_mismatch || !r.rating_mismatch.isMismatch)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = (r.review_text || '').toLowerCase().includes(q);
        const idMatch = (r.review_id || '').toLowerCase().includes(q);
        const prodMatch = (r.product || '').toLowerCase().includes(q);
        const summaryMatch = (r.analysis?.summary || '').toLowerCase().includes(q);
        if (!textMatch && !idMatch && !prodMatch && !summaryMatch) return false;
      }

      return true;
    });
  }, [reviews, selectedProduct, sentimentFilter, topicFilter, needsReplyOnly, mismatchOnly, searchQuery]);

  // Unique products for dropdown
  const uniqueProducts = useMemo(() => {
    const set = new Set();
    reviews.forEach(r => {
      if (r.product) set.add(r.product);
    });
    return Array.from(set);
  }, [reviews]);

  const renderRating = (row) => {
    if (row.rating_status === 'unknown' || row.rating === null) {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
          title={`Raw value: "${row.raw_text !== undefined ? row.rating_status : 'unknown'}"`}
        >
          <HelpCircle className="w-3 h-3 mr-1 text-slate-400" />
          Unknown
        </span>
      );
    }

    return (
      <div className="flex items-center space-x-0.5 text-amber-400" title={`${row.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= row.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderSentimentBadge = (sentiment, status) => {
    if (status === 'skipped_empty') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Empty Skipped
        </span>
      );
    }
    if (status === 'analysis_failed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          Analysis Failed
        </span>
      );
    }

    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Positive
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Negative
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Neutral
          </span>
        );
    }
  };

  const isTranslated = (text) => {
    if (!text) return false;
    // Hindi unicode or Hinglish keywords
    return /[\u0900-\u097F]/.test(text) || /\b(accha|kharab|bahut|phata|thi|hai|zyada|badhiya|par)\b/i.test(text);
  };

  const isPromptInjectionAttempt = (text) => {
    if (!text) return false;
    return text.toLowerCase().includes('ignore all previous instructions');
  };

  const isSarcastic = (text) => {
    if (!text) return false;
    return text.includes('🙄') || text.toLowerCase().includes('delivered in just 3 weeks');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Table Controls Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by text, ID, or summary..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={e => onSelectProduct(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Products</option>
            {uniqueProducts.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={e => setSentimentFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
            <option value="analysis_failed">Analysis Failed</option>
          </select>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Topics</option>
            <option value="quality">Quality</option>
            <option value="delivery">Delivery</option>
            <option value="size_fit">Size & Fit</option>
            <option value="price">Price</option>
            <option value="packaging">Packaging</option>
            <option value="support">Support</option>
            <option value="other">Other</option>
          </select>

          {/* Needs Reply Toggle */}
          <button
            onClick={() => setNeedsReplyOnly(!needsReplyOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              needsReplyOnly
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Needs Reply Only</span>
          </button>

          {/* Mismatch Toggle (Bonus) */}
          <button
            onClick={() => setMismatchOnly(!mismatchOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              mismatchOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Filter reviews where star rating and sentiment disagree"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Rating Mismatches</span>
          </button>
        </div>

      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Review ID</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Rating</th>
              <th className="py-3 px-4">Sentiment</th>
              <th className="py-3 px-4">Topics</th>
              <th className="py-3 px-4 min-w-[280px]">English Summary & Context</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-slate-400">
                  No reviews match your selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredReviews.map(row => {
                const isReplied = repliedReviewIds.has(row.review_id);
                const hasMismatch = row.rating_mismatch && row.rating_mismatch.isMismatch;
                const translated = isTranslated(row.review_text);
                const isAdversarial = isPromptInjectionAttempt(row.review_text);
                const sarcastic = isSarcastic(row.review_text);

                return (
                  <tr
                    key={row.review_id}
                    className={`hover:bg-indigo-50/20 transition-colors ${
                      row.is_empty ? 'opacity-60 bg-slate-50' : ''
                    }`}
                  >
                    {/* Review ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{row.review_id}</span>
                        {row.is_duplicate && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-600"
                            title={`Duplicate of ${row.duplicate_of} — analysis served from cache`}
                          >
                            DUP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {row.product}
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderRating(row)}
                    </td>

                    {/* Sentiment */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderSentimentBadge(row.analysis?.sentiment, row.status)}
                    </td>

                    {/* Topics */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {row.analysis?.topics && row.analysis.topics.length > 0 ? (
                          row.analysis.topics.map(topic => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize"
                            >
                              {topic.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Summary & Tags */}
                    <td className="py-3 px-4">
                      {row.is_empty ? (
                        <span className="italic text-slate-400">Empty review text provided</span>
                      ) : row.status === 'analysis_failed' ? (
                        <span className="text-rose-600">{row.analysis?.error || 'Analysis failed'}</span>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900 text-xs leading-snug">
                            {row.analysis?.summary}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                            "{row.review_text}"
                          </p>

                          {/* Contextual badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {translated && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
                                <Languages className="w-2.5 h-2.5 mr-1" />
                                Translated from Hindi/Hinglish
                              </span>
                            )}
                            {isAdversarial && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <ShieldCheck className="w-2.5 h-2.5 mr-1 text-blue-600" />
                                Prompt Injection Defended (R012)
                              </span>
                            )}
                            {sarcastic && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Sarcasm Detected 🙄
                              </span>
                            )}
                            {hasMismatch && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                                title={row.rating_mismatch.reason}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 mr-1 text-rose-500" />
                                Rating Mismatch ({row.rating}★ vs {row.analysis?.sentiment})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {row.analysis?.needs_reply ? (
                        isReplied ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Replied</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenReplyModal(row)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Draft Reply</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredReviews.length} of {reviews.length} total reviews</span>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Positive</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Neutral</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Negative</span>
          </span>
        </div>
      </div>
    </div>
  );
}
