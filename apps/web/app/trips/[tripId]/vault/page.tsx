'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Upload,
  Trash2,
  File,
  Image as ImageIcon,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

interface VaultFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url?: string;
}

export default function VaultPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [files, setFiles] = React.useState<VaultFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return { Authorization: `Bearer ${token}` };
  };

  React.useEffect(() => {
    if (user && tripId) {
      fetchFiles();
    }
  }, [user, tripId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const config = { headers: getAuthHeader() };
      const res = await axios.get(`${API_BASE_URL}/trips/${tripId}/vault/files`, config);
      setFiles(res.data || []);
    } catch (error) {
      console.error('Failed to fetch vault files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('mimeType', file.type || 'application/octet-stream');

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post(`${API_BASE_URL}/trips/${tripId}/vault/files`, formData, config);
      fetchFiles();
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file from the vault?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/vault/files/${fileId}`, config);
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

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

  return (
    <PageShell
      title="Trip Vault"
      subtitle="Encrypted, offline-ready storage for boarding passes, Airbnb vouchers, and documents."
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trip Overview', href: `/trips/${tripId}` },
        { label: 'Vault' },
      ]}
    >
      {/* Upload Zone Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Document or Voucher</CardTitle>
          <CardDescription>
            Supported formats: PDF, Images (PNG, JPG), Word documents. Max file size: 50MB.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {uploadError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200">
              {uploadError}
            </div>
          )}

          <label className="block cursor-pointer group">
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center transition group-hover:border-indigo-400 group-hover:bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:group-hover:border-indigo-700">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 mb-3 group-hover:scale-110 transition duration-200">
                <Upload className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Click to browse or drag and drop files here
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Shared immediately with all members of this trip
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {uploading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Encrypting and uploading file...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vault Files List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Stored Travel Documents ({files.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All trip files are synchronized and protected.
            </p>
          </div>
          <Badge variant="success">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Encrypted
          </Badge>
        </div>

        {loading ? (
          <div className="trip-glass-card rounded-2xl p-8 text-center animate-pulse">
            <p className="text-sm text-slate-500">Loading vault...</p>
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={<HardDrive className="h-8 w-8" />}
            title="No files in vault yet"
            description="Upload e-tickets, hotel booking PDFs, or rental confirmations to keep everyone organized."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="trip-glass-card rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 shadow-inner">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {file.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono uppercase text-slate-400 text-[10px]">
                    {file.mimeType.split('/')[1] || 'FILE'}
                  </span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
