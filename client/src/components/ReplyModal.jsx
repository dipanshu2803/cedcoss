import React, { useState } from 'react';
import { X, Reply, Copy, Check, Sparkles, Loader2, Store, Send } from 'lucide-react';

export default function ReplyModal({
  review,
  isOpen,
  onClose,
  onMarkReplied
}) {
  if (!isOpen || !review) return null;

  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate reply on initial open if not already set
  React.useEffect(() => {
    let isMounted = true;

    async function fetchReply() {
      setLoading(true);
      try {
        const res = await fetch('/api/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review })
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setReplyText(data.suggested_reply);
        }
      } catch (err) {
        if (isMounted) {
          setReplyText(`Dear customer, thank you for contacting us regarding your ${review.product}. We are truly sorry for the trouble and would love to resolve this right away. Please reach out to us at support@reviewlens.store.`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReply();

    return () => {
      isMounted = false;
    };
  }, [review]);

  const handleCopy = () => {
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOrMark = () => {
    onMarkReplied(review.review_id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Suggested Store Reply</h3>
              <p className="text-[11px] text-slate-500">
                Generated on-demand for review <span className="font-mono font-semibold">{review.review_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Customer Feedback Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex justify-between items-center mb-1 text-slate-500 font-semibold">
              <span>{review.product}</span>
              <span className="text-amber-500">{review.rating ? `${review.rating}★` : 'Rating Unknown'}</span>
            </div>
            <p className="text-slate-700 italic">"{review.review_text}"</p>
            {review.analysis?.summary && (
              <p className="mt-2 text-[11px] font-medium text-indigo-700 pt-1.5 border-t border-slate-200/60">
                AI Summary: {review.analysis.summary}
              </p>
            )}
          </div>

          {/* AI Response Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span>Store Owner Response (Editable)</span>
              </label>
              {loading && (
                <span className="flex items-center space-x-1 text-[11px] text-indigo-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Drafting...</span>
                </span>
              )}
            </div>

            <textarea
              rows="5"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              disabled={loading}
              placeholder="Generating contextual apology & resolution response..."
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all leading-relaxed"
            />
          </div>

        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={loading || !replyText}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Reply</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendOrMark}
              disabled={loading || !replyText}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mark as Replied</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
