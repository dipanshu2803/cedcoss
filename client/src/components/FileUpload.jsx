import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Play, Loader2 } from 'lucide-react';

export default function FileUpload({ onUploadFile, onLoadSample, loading, progress }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onUploadFile(file);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onUploadFile(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="hidden"
          />
          <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {selectedFileName ? selectedFileName : 'Drag & drop reviews.csv here or click to browse'}
          </p>
          <p className="text-xs text-slate-400">
            Accepts raw CSV with messy ratings, Hinglish, sarcasm, HTML tags, and edge cases
          </p>
        </div>

        {/* Divider / Action Choice */}
        <div className="flex lg:flex-col items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <div className="hidden lg:block w-px h-8 bg-slate-200"></div>
          <span>OR</span>
          <div className="hidden lg:block w-px h-8 bg-slate-200"></div>
        </div>

        {/* 1-Click Bundled Dataset Button */}
        <div className="flex flex-col justify-center sm:min-w-[280px]">
          <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 rounded-xl p-5 border border-indigo-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm mb-1">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Test Dataset Bundled</span>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Load the provided 30 messy reviews (R001–R030) testing R012 prompt injection, Hinglish, emojis, and unknown ratings.
              </p>
            </div>

            <button
              onClick={onLoadSample}
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Reviews...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Analyze Sample reviews.csv</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Loading Progress Bar */}
      {loading && (
        <div className="mt-5 pt-4 border-t border-slate-100 animate-pulse">
          <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1.5">
            <span className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analyzing reviews in batches with rate-limit defense & caching...</span>
            </span>
            <span className="text-indigo-600 font-semibold">{progress || 'In Progress'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-2 rounded-full w-full animate-indeterminate"></div>
          </div>
        </div>
      )}
    </div>
  );
}
