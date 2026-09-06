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
  Download,
  Eye,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { useAuth } from '@/lib/auth-context';
import { PageShell } from '@/components/ui/page-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';
import { FilePreviewModal, VaultPreviewFile } from '@/components/vault/file-preview-modal';

interface VaultFile extends VaultPreviewFile {}

export default function VaultPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [files, setFiles] = React.useState<VaultFile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const [selectedFileForPreview, setSelectedFileForPreview] = React.useState<VaultFile | null>(null);

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
      formData.append('size', String(file.size));

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post(`${API_BASE_URL}/trips/${tripId}/vault/files`, formData, config);
      fetchFiles();
      // Reset input
      e.target.value = '';
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setUploadError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to upload file'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file from the vault?')) return;
    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/vault/files/${fileId}`, config);
      fetchFiles();
      if (selectedFileForPreview?.id === fileId) {
        setSelectedFileForPreview(null);
      }
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
      subtitle="Shared cloud storage for boarding passes, Airbnb vouchers, and travel documents."
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
            Supported formats: PDF, Images (PNG, JPG, WEBP), Word documents. Max file size: 50MB.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {uploadError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {uploadError}
            </div>
          )}

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center transition-colors hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500/50 cursor-pointer group bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-950/50 dark:text-indigo-400 shadow-sm">
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
              <span>Encrypting and uploading file to vault...</span>
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
              Click any document card to preview full size in-app.
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
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => {
              const accessUrl = file.downloadUrl || file.url;
              const isImage = file.mimeType.startsWith('image/');

              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileForPreview(file)}
                  className="trip-glass-card rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header with Icon and Action Buttons */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 shadow-inner group-hover:scale-105 transition">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFileForPreview(file);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition"
                          title="Preview Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {accessUrl && (
                          <a
                            href={accessUrl}
                            download={file.name}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition"
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={(e) => handleDeleteFile(e, file.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image Thumbnail preview if image */}
                    {isImage && accessUrl && (
                      <div className="mb-3 h-28 w-full overflow-hidden rounded-xl bg-slate-950/5 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center">
                        <img
                          src={accessUrl}
                          alt={file.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono uppercase text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {file.mimeType.split('/')[1] || 'FILE'}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[11px] group-hover:underline">
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen In-App Document Preview Modal */}
      <FilePreviewModal
        file={selectedFileForPreview}
        isOpen={!!selectedFileForPreview}
        onClose={() => setSelectedFileForPreview(null)}
      />
    </PageShell>
  );
}
