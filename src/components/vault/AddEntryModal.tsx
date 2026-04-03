/**
 * AddEntryModal — modal for adding a new vault entry of any supported type.
 */

import { useState, useRef, type FormEvent } from 'react';
import { useVault } from '../../hooks/useVault';

interface AddEntryModalProps {
  onClose: () => void;
}

type EntryType = 'password' | 'file' | 'note' | 'api_key';

/** Full-screen modal with a type selector and type-specific form fields. */
export function AddEntryModal({ onClose }: AddEntryModalProps) {
  const { addPasswordEntry, addFileEntry, addNoteEntry, addApiKeyEntry } = useVault();

  const [entryType, setEntryType] = useState<EntryType>('password');
  const [label, setLabel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiService, setApiService] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setProgress(20);
    try {
      if (entryType === 'password') {
        await addPasswordEntry(label, username, password);
      } else if (entryType === 'file' && selectedFile) {
        await addFileEntry(label, selectedFile);
      } else if (entryType === 'note') {
        await addNoteEntry(label, noteContent);
      } else if (entryType === 'api_key') {
        await addApiKeyEntry(label, apiKey, apiService);
      }
      setProgress(100);
      onClose();
    } catch {
      // errors handled by store
    } finally {
      setUploading(false);
    }
  };

  const TYPES: { value: EntryType; label: string }[] = [
    { value: 'password', label: 'Password' },
    { value: 'file', label: 'File' },
    { value: 'note', label: 'Note' },
    { value: 'api_key', label: 'API Key' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-950/80 flex items-center justify-center z-50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-700 bg-gray-800 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-50">Add Vault Entry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setEntryType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                entryType === t.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400'
              }`}
              aria-label={`Select ${t.label} type`}
              aria-pressed={entryType === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-label">
              Label
            </label>
            <input
              id="entry-label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My Gmail account"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              aria-label="Entry label"
            />
          </div>

          {entryType === 'password' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-username">
                  Username
                </label>
                <input
                  id="entry-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  aria-label="Username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-password">
                  Password
                </label>
                <input
                  id="entry-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  aria-label="Password"
                />
              </div>
            </>
          )}

          {entryType === 'file' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-file">
                File
              </label>
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) setSelectedFile(file);
                }}
                role="button"
                aria-label="Drop file or click to select"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click(); }}
              >
                <input
                  ref={fileRef}
                  id="entry-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  aria-label="File input"
                />
                {selectedFile ? (
                  <p className="text-sm text-gray-300">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Drag & drop a file, or click to browse</p>
                )}
              </div>
            </div>
          )}

          {entryType === 'note' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-note">
                Content
              </label>
              <textarea
                id="entry-note"
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                aria-label="Note content"
              />
            </div>
          )}

          {entryType === 'api_key' && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-apikey">
                  API Key
                </label>
                <input
                  id="entry-apikey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  aria-label="API key value"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1" htmlFor="entry-service">
                  Service
                </label>
                <input
                  id="entry-service"
                  type="text"
                  value={apiService}
                  onChange={(e) => setApiService(e.target.value)}
                  placeholder="OpenAI, GitHub, AWS..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  aria-label="Service name"
                />
              </div>
            </>
          )}

          {uploading && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              aria-label="Save vault entry"
            >
              {uploading ? 'Saving…' : 'Save Entry'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
