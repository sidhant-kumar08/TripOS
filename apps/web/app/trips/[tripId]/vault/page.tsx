'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/runtime-config';
import { PageShell } from '@/components/ui/page-shell';
import { Card } from '@/components/ui/controls';

interface VaultFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function VaultPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, tripId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const config = { headers: getAuthHeader() };
      const res = await axios.get(`${API_BASE_URL}/trips/${tripId}/vault/files`, config);
      setFiles(res.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('mimeType', file.type);

      const token = localStorage.getItem('accessToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post(`${API_BASE_URL}/trips/${tripId}/vault/files`, formData, config);
      fetchFiles();
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;

    try {
      const config = { headers: getAuthHeader() };
      await axios.delete(`${API_BASE_URL}/trips/${tripId}/vault/files/${fileId}`, config);
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading vault...</div>;
  }

  return (
    <PageShell title="Trip Vault" subtitle="Store and organize shared files for the trip.">
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900">Upload Files</h2>
        <label className="mt-5 block cursor-pointer">
          <div className="rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50">
            <div className="mb-3 text-4xl">📁</div>
            <p className="font-semibold text-slate-700">Click to upload or drag and drop</p>
            <p className="mt-1 text-sm text-slate-500">Any file type, up to 100MB</p>
          </div>
          <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
        </label>
        {uploading && <p className="mt-3 text-sm font-medium text-blue-600">Uploading...</p>}
      </Card>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Files</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Files ({files.length})</h2>
          </div>
        </div>

        {files.length === 0 ? (
          <Card className="text-center text-slate-500">No files in vault yet</Card>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{file.name}</p>
                  <div className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => handleDeleteFile(file.id)} className="trip-button-secondary px-3 py-2 text-xs text-red-600 hover:text-red-700">
                  Delete
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
