'use client';

import * as React from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  File,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface VaultPreviewFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl?: string | null;
  url?: string | null;
}

interface FilePreviewModalProps {
  file: VaultPreviewFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [iframeError, setIframeError] = React.useState(false);

  React.useEffect(() => {
    // Reset view controls on file change
    setZoom(1);
    setRotation(0);
    setIframeError(false);
  }, [file]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const accessUrl = file.downloadUrl || file.url;
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText =
    file.mimeType.startsWith('text/') ||
    file.mimeType === 'application/json' ||
    file.name.toLowerCase().endsWith('.txt') ||
    file.name.toLowerCase().endsWith('.csv');

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />;
    return <File className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in-95 duration-200 z-10 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              {getFileIcon(file.mimeType)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
                <span>•</span>
                <span className="uppercase font-mono text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {file.mimeType.split('/')[1] || 'FILE'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[10px] font-mono font-semibold px-1 min-w-[36px] text-center text-slate-700 dark:text-slate-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition"
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            )}

            {accessUrl && (
              <>
                <a
                  href={accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </a>
                <a
                  href={accessUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition active:scale-95"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="relative flex-1 min-h-[300px] max-h-[75vh] overflow-auto p-4 flex items-center justify-center bg-slate-950/5 dark:bg-slate-950/40">
          {!accessUrl ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 mb-3">
                <File className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Preview Not Available
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                This document is stored securely in the database. Ensure Supabase Storage credentials are configured to generate live access URLs.
              </p>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center w-full h-full overflow-auto p-2">
              <img
                src={accessUrl}
                alt={file.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[70vh] flex flex-col">
              {!iframeError ? (
                <iframe
                  src={`${accessUrl}#toolbar=1`}
                  title={file.name}
                  className="w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white shadow-inner"
                  onError={() => setIframeError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <FileText className="h-12 w-12 text-red-500 mb-3" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    PDF Preview
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    Your browser does not support inline PDF rendering for this link.
                  </p>
                  <a
                    href={accessUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open PDF in New Window</span>
                  </a>
                </div>
              )}
            </div>
          ) : isText ? (
            <div className="w-full h-[65vh]">
              <iframe
                src={accessUrl}
                title={file.name}
                className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 font-mono text-xs shadow-inner"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-md shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 mb-4 shadow-inner">
                {getFileIcon(file.mimeType)}
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {file.name}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(file.size)} • {file.mimeType}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <a
                  href={accessUrl}
                  download={file.name}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-end encrypted storage via Supabase</span>
          </div>
          <span className="font-mono text-[10px]">
            ID: {file.id.slice(0, 10)}...
          </span>
        </div>
      </div>
    </div>
  );
}
