import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import FileUpload from './components/FileUpload.jsx';
import MetricsSummary from './components/MetricsSummary.jsx';
import InsightsSection from './components/InsightsSection.jsx';
import ProductView from './components/ProductView.jsx';
import ReviewsTable from './components/ReviewsTable.jsx';
import ReplyModal from './components/ReplyModal.jsx';
import PerformanceLog from './components/PerformanceLog.jsx';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [serverStatus, setServerStatus] = useState(null);
  const [data, setData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);
  const [repliedReviewIds, setRepliedReviewIds] = useState(new Set());
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch health and server status on mount
  useEffect(() => {
    fetchServerStatus();
    // Auto-load sample if requested via URL query param e.g. ?sample=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sample') === 'true' || urlParams.get('demo') === 'true') {
      handleLoadSample();
    }
  }, []);

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        setServerStatus(json);
      }
    } catch {
      // Backend not yet reachable or in dev mode
    }
  };

  // Upload user file
  const handleUploadFile = async (file) => {
    setLoading(true);
    setProgress('Uploading and cleaning dataset...');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process CSV file');
      }

      setData(json);
      fetchServerStatus();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // Load bundled 30 reviews sample
  const handleLoadSample = async () => {
    setLoading(true);
    setProgress('Parsing 30 messy reviews in batches...');
    setErrorMessage('');

    try {
      const res = await fetch('/api/sample');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process sample dataset');
      }

      setData(json);
      fetchServerStatus();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleReset = () => {
    setData(null);
    setSelectedProduct('all');
    setRepliedReviewIds(new Set());
    setErrorMessage('');
  };

  const handleMarkReplied = (reviewId) => {
    setRepliedReviewIds(prev => new Set([...prev, reviewId]));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Header serverStatus={serverStatus} onReset={data ? handleReset : null} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex justify-between items-center">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Zone & Bundled Sample Loader */}
        <FileUpload
          onUploadFile={handleUploadFile}
          onLoadSample={handleLoadSample}
          loading={loading}
          progress={progress}
        />

        {/* Data Dashboard */}
        {data && (
          <>
            {/* Core Summary Cards */}
            <MetricsSummary
              summary={data.insights?.summary}
              cleaningStats={data.cleaning_stats}
              metrics={data.metrics}
            />

            {/* Performance, Cache & Cost Log (Bonus) */}
            <PerformanceLog
              metrics={data.metrics}
              serverStatus={serverStatus}
            />

            {/* Top 3 Complaints & Top 3 Praises Across Products */}
            <InsightsSection
              topComplaints={data.insights?.top_complaints}
              topPraises={data.insights?.top_praises}
            />

            {/* Product Analytics Breakdown (Bonus) */}
            <ProductView
              products={data.insights?.products}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
            />

            {/* Filterable Reviews Table & On-Demand Actions */}
            <ReviewsTable
              reviews={data.reviews}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              onOpenReplyModal={setSelectedReviewForReply}
              repliedReviewIds={repliedReviewIds}
            />
          </>
        )}

        {/* Empty state when no data loaded */}
        {!data && !loading && (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-white/60">
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Reviews Loaded Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Click <strong>"Analyze Sample reviews.csv"</strong> above to see ReviewLens analyze all 30 messy reviews, or upload your own CSV file.
            </p>
          </div>
        )}

      </main>

      {/* Suggested Reply Modal (On-Demand) */}
      <ReplyModal
        review={selectedReviewForReply}
        isOpen={Boolean(selectedReviewForReply)}
        onClose={() => setSelectedReviewForReply(null)}
        onMarkReplied={handleMarkReplied}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>ReviewLens — CEDCOSS Technical Assessment (AI Review Insights)</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Built with React, Node.js, SQLite Caching, Zod Schema Validation, and Prompt Injection Defense
        </p>
      </footer>
    </div>
  );
}
